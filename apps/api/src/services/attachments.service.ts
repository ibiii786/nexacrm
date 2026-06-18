import prisma from '../config/database';
import fs from 'fs/promises';
import path from 'path';

export class AttachmentsService {
  static async uploadAttachment(data: {
    orderId: string;
    filename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  }) {
    return prisma.attachment.create({
      data: {
        orderId: data.orderId,
        filename: data.filename,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedBy: data.uploadedBy,
      }
    });
  }

  static async getAttachmentsForOrder(orderId: string) {
    return prisma.attachment.findMany({
      where: { orderId },
      include: {
        uploader: { select: { id: true, name: true } }
      },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  static async getAttachmentById(id: string) {
    return prisma.attachment.findUnique({
      where: { id }
    });
  }

  static async deleteAttachment(id: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new Error('Attachment not found');

    // Remove from database
    await prisma.attachment.delete({ where: { id } });

    // Remove from local filesystem
    try {
      await fs.unlink(path.resolve(attachment.filePath));
    } catch (error) {
      console.error(`Failed to delete file from disk: ${attachment.filePath}`, error);
      // We don't throw here because DB deletion succeeded, it's just an orphaned file on disk
    }
  }
}
