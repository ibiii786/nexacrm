import prisma from '../config/database';

export class OrderSequenceService {
  /**
   * Generates the next sequential order number in the format YYYY-XXXXX
   * Uses an atomic upsert/increment to prevent race conditions.
   */
  static async generateNextOrderNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();

    // Atomic increment/upsert
    const sequence = await prisma.orderSequence.upsert({
      where: { year: currentYear },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        year: currentYear,
        lastNumber: 1,
      },
    });

    // Format: YYYY-00001
    const paddedNumber = sequence.lastNumber.toString().padStart(5, '0');
    return `${currentYear}-${paddedNumber}`;
  }
}
