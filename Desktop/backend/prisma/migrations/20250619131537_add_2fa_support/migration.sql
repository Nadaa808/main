/*
  Warnings:

  - You are about to alter the column `userId` on the `activitylog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `activitylog` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `countryOfResidency` VARCHAR(191) NULL,
    ADD COLUMN `twoFactorBackupCodes` VARCHAR(191) NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorLastUsed` DATETIME(3) NULL,
    ADD COLUMN `twoFactorSecret` VARCHAR(191) NULL,
    MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER') NULL;

-- CreateIndex
CREATE INDEX `User_userType_clientType_isActive_idx` ON `User`(`userType`, `clientType`, `isActive`);

-- CreateIndex
CREATE INDEX `User_role_isActive_idx` ON `User`(`role`, `isActive`);

-- CreateIndex
CREATE INDEX `User_email_isActive_idx` ON `User`(`email`, `isActive`);
