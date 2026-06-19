import prisma from '../config/database';
import DOMPurify from 'isomorphic-dompurify';

export class StatusesService {
  static async getStatuses(includeArchived = false) {
    return prisma.status.findMany({
      where: includeArchived ? undefined : { isArchived: false },
      include: {
        statusFields: {
          include: { field: true }
        }
      },
      orderBy: { position: 'asc' }
    });
  }

  static async getStatusById(id: string) {
    return prisma.status.findUnique({
      where: { id },
      include: {
        statusFields: {
          include: { field: true }
        }
      }
    });
  }

  static async createStatus(data: {
    name: string;
    color: string;
    icon?: string;
    isDefault?: boolean;
    position: number;
    createdBy: string;
    fieldIds?: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      // If setting this to default, unset other defaults
      if (data.isDefault) {
        await tx.status.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const status = await tx.status.create({
        data: {
          name: DOMPurify.sanitize(data.name),
          color: DOMPurify.sanitize(data.color),
          icon: data.icon ? DOMPurify.sanitize(data.icon) : undefined,
          isDefault: data.isDefault || false,
          position: data.position,
          createdBy: data.createdBy,
          statusFields: data.fieldIds ? {
            create: data.fieldIds.map(fieldId => ({ fieldId }))
          } : undefined
        },
        include: {
          statusFields: { include: { field: true } }
        }
      });
      return status;
    });
  }

  static async updateStatus(id: string, data: {
    name?: string;
    color?: string;
    icon?: string;
    isDefault?: boolean;
    isArchived?: boolean;
    position?: number;
    fieldIds?: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.status.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false }
        });
      }

      // If fieldIds provided, replace existing relations
      if (data.fieldIds !== undefined) {
        await tx.statusField.deleteMany({ where: { statusId: id } });
      }

      return tx.status.update({
        where: { id },
        data: {
          name: data.name ? DOMPurify.sanitize(data.name) : undefined,
          color: data.color ? DOMPurify.sanitize(data.color) : undefined,
          icon: data.icon ? DOMPurify.sanitize(data.icon) : undefined,
          isDefault: data.isDefault,
          isArchived: data.isArchived,
          position: data.position,
          ...(data.fieldIds !== undefined && {
            statusFields: {
              create: data.fieldIds.map(fieldId => ({ fieldId }))
            }
          })
        },
        include: {
          statusFields: { include: { field: true } }
        }
      });
    });
  }

  static async deleteStatus(id: string) {
    // Instead of actual delete, we can let Prisma do it if no orders are attached.
    // If orders are attached, this will fail due to foreign key constraints, which is desired.
    return prisma.status.delete({
      where: { id }
    });
  }

  /**
   * Used when creating/updating orders to know which fields apply to a status
   */
  static async getFieldsForStatus(statusId: string) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      include: {
        statusFields: {
          include: { field: true }
        }
      }
    });

    if (!status) return [];

    const specificFields = status.statusFields.map(sf => sf.field);
    const globalFields = await prisma.field.findMany({
      where: { isGlobal: true }
    });

    // Merge and deduplicate just in case
    const allFields = [...globalFields, ...specificFields];
    const unique = Array.from(new Map(allFields.map(f => [f.id, f])).values());
    
    // Sort by position
    return unique.sort((a, b) => a.position - b.position);
  }
}
