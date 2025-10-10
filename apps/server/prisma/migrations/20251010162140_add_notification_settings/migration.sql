-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "emailFrom" TEXT,
ADD COLUMN     "emailHost" TEXT,
ADD COLUMN     "emailPass" TEXT,
ADD COLUMN     "emailPort" TEXT,
ADD COLUMN     "emailUser" TEXT,
ADD COLUMN     "twilioAuthToken" TEXT,
ADD COLUMN     "twilioPhoneNumber" TEXT,
ADD COLUMN     "twilioSid" TEXT;
