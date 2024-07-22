/*
  Warnings:

  - The `offDays` column on the `Doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endDate` to the `Appointement` table without a default value. This is not possible if the table is not empty.
  - Made the column `specialization` on table `Doctor` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_userId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_doctorId_fkey";

-- AlterTable
ALTER TABLE "Appointement" ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Doctor" ALTER COLUMN "specialization" SET NOT NULL,
DROP COLUMN "offDays",
ADD COLUMN     "offDays" TIMESTAMP(3)[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetToken" TEXT;

-- DropTable
DROP TABLE "Schedule";

-- CreateTable
CREATE TABLE "AppointementHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "age" INTEGER NOT NULL,
    "doctorNote" TEXT NOT NULL,
    "diseaseName" TEXT,
    "isThereIsControll" BOOLEAN NOT NULL,

    CONSTRAINT "AppointementHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppointementHistory" ADD CONSTRAINT "AppointementHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
