/*
  Warnings:

  - You are about to drop the column `amount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `electricityCharge` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `rent` on the `Room` table. All the data in the column will be lost.
  - Added the required column `rentAmount` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentAmount` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Member" ADD COLUMN     "rentAmount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "amount",
ADD COLUMN     "electricityAmount" DOUBLE PRECISION,
ADD COLUMN     "rentAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "electricityCharge",
DROP COLUMN "rent";

-- CreateTable
CREATE TABLE "public"."ElectricityCharge" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "unitsUsed" INTEGER NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectricityCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ElectricityCharge_pgId_month_year_idx" ON "public"."ElectricityCharge"("pgId", "month", "year");

-- CreateIndex
CREATE INDEX "ElectricityCharge_roomId_idx" ON "public"."ElectricityCharge"("roomId");

-- CreateIndex
CREATE INDEX "ElectricityCharge_createdBy_idx" ON "public"."ElectricityCharge"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricityCharge_roomId_month_year_key" ON "public"."ElectricityCharge"("roomId", "month", "year");

-- AddForeignKey
ALTER TABLE "public"."ElectricityCharge" ADD CONSTRAINT "ElectricityCharge_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ElectricityCharge" ADD CONSTRAINT "ElectricityCharge_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "public"."PG"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ElectricityCharge" ADD CONSTRAINT "ElectricityCharge_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
