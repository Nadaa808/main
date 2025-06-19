-- Migration to fix UserType enum mismatch
-- Remove VERIFIER and COMPLIANCE_OFFICER from UserType enum

-- First, update any existing users with invalid userTypes
UPDATE `user` 
SET `userType` = NULL 
WHERE `userType` IN ('VERIFIER', 'COMPLIANCE_OFFICER');

-- Then, alter the enum to match the schema
ALTER TABLE `user` 
MODIFY COLUMN `userType` ENUM('ISSUER', 'INVESTOR') NULL; 