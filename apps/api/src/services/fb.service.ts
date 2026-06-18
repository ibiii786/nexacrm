import { prisma } from '../config/database';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0000000000000000000000000000000000000000000000000000000000000000'; // Fallback for types, should be 32 bytes hex in prod (64 chars)
const ALGORITHM = 'aes-256-gcm';

export class FbService {
  
  // === ENCRYPTION / DECRYPTION ===
  
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // === FB ACCOUNTS CRUD ===

  async getFbAccounts(filters?: { status?: string, assignedTo?: string }) {
    return prisma.fbAccount.findMany({
      where: filters,
      include: {
        assignee: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFbAccountById(id: string) {
    return prisma.fbAccount.findUnique({
      where: { id },
      include: {
        assignee: true,
        statusLogs: {
          include: {
            changer: true
          },
          orderBy: { changedAt: 'desc' }
        }
      }
    });
  }

  async createFbAccount(data: any, createdBy: string) {
    const encryptedNote = data.vaultNote ? this.encrypt(data.vaultNote) : null;

    return prisma.fbAccount.create({
      data: {
        displayName: data.displayName,
        linkedEmail: data.linkedEmail,
        status: data.status || 'ACTIVE',
        creationDate: data.creationDate ? new Date(data.creationDate) : null,
        lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate) : null,
        notes: data.notes,
        assignedTo: data.assignedTo,
        vaultNoteEncrypted: encryptedNote,
        createdBy,
        // Automatically create initial status log
        statusLogs: {
          create: {
            newStatus: data.status || 'ACTIVE',
            changedBy: createdBy,
            reason: 'Initial creation'
          }
        }
      },
      include: {
        assignee: true
      }
    });
  }

  async updateFbAccount(id: string, data: any, updatedBy: string) {
    const currentAccount = await prisma.fbAccount.findUnique({ where: { id } });
    if (!currentAccount) throw new Error('Account not found');

    let encryptedNote = currentAccount.vaultNoteEncrypted;
    if (data.vaultNote !== undefined) {
      encryptedNote = data.vaultNote ? this.encrypt(data.vaultNote) : null;
    }

    const newStatus = data.status || currentAccount.status;
    const isStatusChanged = currentAccount.status !== newStatus;

    return prisma.fbAccount.update({
      where: { id },
      data: {
        displayName: data.displayName,
        linkedEmail: data.linkedEmail,
        status: newStatus,
        creationDate: data.creationDate ? new Date(data.creationDate) : undefined,
        lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate) : undefined,
        notes: data.notes,
        assignedTo: data.assignedTo,
        vaultNoteEncrypted: encryptedNote,
        ...(isStatusChanged ? {
          statusLogs: {
            create: {
              oldStatus: currentAccount.status,
              newStatus: newStatus,
              changedBy: updatedBy,
              reason: data.statusChangeReason || 'Status updated via edit'
            }
          }
        } : {})
      },
      include: {
        assignee: true,
        statusLogs: {
          include: {
            changer: true
          },
          orderBy: { changedAt: 'desc' }
        }
      }
    });
  }

  async deleteFbAccount(id: string) {
    return prisma.fbAccount.delete({ where: { id } });
  }

  // === VAULT DECRYPTION ===

  async getDecryptedVaultNote(id: string) {
    const account = await prisma.fbAccount.findUnique({ where: { id } });
    if (!account) throw new Error('Account not found');
    if (!account.vaultNoteEncrypted) return null;
    
    return this.decrypt(account.vaultNoteEncrypted);
  }
}

export const fbService = new FbService();
