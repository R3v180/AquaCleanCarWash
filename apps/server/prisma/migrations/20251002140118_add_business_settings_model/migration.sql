-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL,
    "weeklySchedule" JSONB NOT NULL,
    "singleton" TEXT NOT NULL DEFAULT 'SINGLETON',

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSettings_singleton_key" ON "BusinessSettings"("singleton");
