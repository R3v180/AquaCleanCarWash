/*
  Warnings:

  - The values [PENDING_PAYMENT] on the enum `AppointmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentStatus_new" AS ENUM ('AVAILABLE', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
ALTER TABLE "Appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");
ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";
DROP TYPE "AppointmentStatus_old";
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE',
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
