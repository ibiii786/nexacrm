-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "final_paid_amount" DECIMAL(10,2),
ADD COLUMN     "final_paid_note" TEXT;
