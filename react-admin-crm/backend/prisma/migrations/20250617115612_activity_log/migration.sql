/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[didAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `didAddress` VARCHAR(191) NULL,
    ADD COLUMN `walletAddress` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `kyc_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `submissionType` ENUM('KYC', 'KYB') NOT NULL DEFAULT 'KYC',
    `sumsubApplicantId` VARCHAR(191) NULL,
    `sumsubToken` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'RESUBMISSION_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `documentUrls` JSON NULL,
    `verificationType` ENUM('AUTO', 'MANUAL') NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `walletAddress` VARCHAR(191) NULL,
    `soulboundTokenTx` VARCHAR(191) NULL,
    `verifiableCredential` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kyc_submissions_sumsubApplicantId_key`(`sumsubApplicantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kyc_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` INTEGER NOT NULL,
    `previousStatus` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'RESUBMISSION_REQUIRED') NULL,
    `newStatus` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'RESUBMISSION_REQUIRED') NOT NULL,
    `reason` VARCHAR(191) NULL,
    `verificationType` ENUM('AUTO', 'MANUAL') NOT NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_walletAddress_key` ON `User`(`walletAddress`);

-- CreateIndex
CREATE UNIQUE INDEX `User_didAddress_key` ON `User`(`didAddress`);

-- AddForeignKey
ALTER TABLE `kyc_submissions` ADD CONSTRAINT `kyc_submissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_status_history` ADD CONSTRAINT `kyc_status_history_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `kyc_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
