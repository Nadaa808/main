/*
  Warnings:

  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(0))`.
  - You are about to drop the `asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `didprofile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `investment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kybprofile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kycprofile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `soulboundtoken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verifiablecredential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `asset` DROP FOREIGN KEY `Asset_issuerId_fkey`;

-- DropForeignKey
ALTER TABLE `didprofile` DROP FOREIGN KEY `DIDProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `investment` DROP FOREIGN KEY `Investment_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `investment` DROP FOREIGN KEY `Investment_investorId_fkey`;

-- DropForeignKey
ALTER TABLE `kybprofile` DROP FOREIGN KEY `KYBProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `kycprofile` DROP FOREIGN KEY `KYCProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `soulboundtoken` DROP FOREIGN KEY `SoulboundToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `verifiablecredential` DROP FOREIGN KEY `VerifiableCredential_userId_fkey`;

-- DropForeignKey
ALTER TABLE `wallet` DROP FOREIGN KEY `Wallet_userId_fkey`;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN';

-- DropTable
DROP TABLE `asset`;

-- DropTable
DROP TABLE `didprofile`;

-- DropTable
DROP TABLE `investment`;

-- DropTable
DROP TABLE `kybprofile`;

-- DropTable
DROP TABLE `kycprofile`;

-- DropTable
DROP TABLE `soulboundtoken`;

-- DropTable
DROP TABLE `verifiablecredential`;

-- DropTable
DROP TABLE `wallet`;
