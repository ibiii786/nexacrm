import prisma from '../config/database';

export class FieldsService {
  static async getFields() {
    return prisma.field.findMany({
      orderBy: { position: 'asc' }
    });
  }

  static async getFieldById(id: string) {
    return prisma.field.findUnique({
      where: { id }
    });
  }

  static async createField(data: {
    name: string;
    label: string;
    type: string;
    isRequired?: boolean;
    isVisible?: boolean;
    isGlobal?: boolean;
    options?: any;
    position: number;
    addedBy: string;
  }) {
    return prisma.field.create({
      data: {
        name: data.name,
        label: data.label,
        type: data.type,
        isRequired: data.isRequired,
        isVisible: data.isVisible,
        isGlobal: data.isGlobal,
        options: data.options,
        position: data.position,
        addedBy: data.addedBy,
      }
    });
  }

  static async updateField(id: string, data: {
    name?: string;
    label?: string;
    type?: string;
    isRequired?: boolean;
    isVisible?: boolean;
    isGlobal?: boolean;
    options?: any;
    position?: number;
  }) {
    return prisma.field.update({
      where: { id },
      data
    });
  }

  static async deleteField(id: string) {
    return prisma.field.delete({
      where: { id }
    });
  }
}
