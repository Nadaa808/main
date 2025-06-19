-- Add ClientType enum and update User table
-- This enables 3-dimensional user classification

-- Step 1: Add the new ClientType enum
ALTER TABLE `User` ADD COLUMN `clientType` ENUM('INDIVIDUAL', 'COMMUNITY') NULL;

-- Step 2: Set default clientType based on existing data
-- Individual clients (most common case)
UPDATE `User` 
SET `clientType` = 'INDIVIDUAL' 
WHERE `userType` IN ('INVESTOR', 'ISSUER') 
  AND `role` IS NULL;

-- Step 3: For any existing KYB profiles, mark as COMMUNITY
UPDATE `User` 
SET `clientType` = 'COMMUNITY' 
WHERE `id` IN (
  SELECT DISTINCT `userId` 
  FROM `KYBProfile`
) AND `userType` IN ('INVESTOR', 'ISSUER');

-- Step 4: Staff members should have null clientType (already null by default)
-- No action needed as staff should not have clientType 