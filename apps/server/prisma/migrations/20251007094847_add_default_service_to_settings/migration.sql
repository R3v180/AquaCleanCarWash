/*
  Warnings:

  - A unique constraint covering the columns `[defaultServiceId]` on the table `BusinessSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "defaultServiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSettings_defaultServiceId_key" ON "BusinessSettings"("defaultServiceId");

-- AddForeignKey
ALTER TABLE "BusinessSettings" ADD CONSTRAINT "BusinessSettings_defaultServiceId_fkey" FOREIGN KEY ("defaultServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
