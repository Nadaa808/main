/*
  Warnings:

  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `userType` ENUM('ISSUER', 'INVESTOR', 'VERIFIER', 'COMPLIANCE_OFFICER') NOT NULL DEFAULT 'INVESTOR',
    MODIFY `role` ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN';
