/*
  Warnings:

  - You are about to drop the column `age` on the `AppointementHistory` table. All the data in the column will be lost.
  - Added the required column `age` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointement" ADD COLUMN     "isControll" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AppointementHistory" DROP COLUMN "age";

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "age" INTEGER NOT NULL;
