-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('ADMIN', 'ISSUER', 'INVESTOR', 'VERIFIER', 'COMPLIANCE_OFFICER') NOT NULL DEFAULT 'INVESTOR';

-- CreateTable
CREATE TABLE `KYCProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `nationality` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `idDocumentType` VARCHAR(191) NULL,
    `idDocumentNumber` VARCHAR(191) NULL,
    `idDocumentExpiry` DATETIME(3) NULL,
    `verificationStatus` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KYCProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KYBProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `businessType` VARCHAR(191) NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `taxId` VARCHAR(191) NULL,
    `incorporationDate` DATETIME(3) NULL,
    `businessAddress` VARCHAR(191) NULL,
    `businessCity` VARCHAR(191) NULL,
    `businessCountry` VARCHAR(191) NULL,
    `businessPostalCode` VARCHAR(191) NULL,
    `verificationStatus` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KYBProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DIDProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `didMethod` VARCHAR(191) NOT NULL,
    `didId` VARCHAR(191) NOT NULL,
    `publicKey` VARCHAR(191) NOT NULL,
    `privateKey` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DIDProfile_didId_key`(`didId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerifiableCredential` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `credentialType` VARCHAR(191) NOT NULL,
    `issuer` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `issuanceDate` DATETIME(3) NOT NULL,
    `expirationDate` DATETIME(3) NULL,
    `credential` JSON NOT NULL,
    `proof` JSON NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SoulboundToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tokenType` VARCHAR(191) NOT NULL,
    `tokenId` VARCHAR(191) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `blockchain` VARCHAR(191) NOT NULL DEFAULT 'Ethereum',
    `metadata` JSON NOT NULL,
    `attributes` JSON NULL,
    `mintedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SoulboundToken_tokenId_key`(`tokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wallet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `walletType` ENUM('METAMASK', 'WALLET_CONNECT', 'HARDWARE', 'CUSTODIAL', 'MULTI_SIG') NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `publicKey` VARCHAR(191) NULL,
    `encryptedPrivateKey` VARCHAR(191) NULL,
    `blockchain` VARCHAR(191) NOT NULL DEFAULT 'Ethereum',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Wallet_address_key`(`address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `issuerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `assetType` ENUM('REAL_ESTATE', 'COMMODITIES', 'ART_COLLECTIBLES', 'PRIVATE_EQUITY', 'BONDS', 'INFRASTRUCTURE', 'INTELLECTUAL_PROPERTY', 'OTHER') NOT NULL,
    `totalSupply` DECIMAL(65, 30) NOT NULL,
    `contractAddress` VARCHAR(191) NULL,
    `blockchain` VARCHAR(191) NOT NULL DEFAULT 'Ethereum',
    `tokenStandard` VARCHAR(191) NOT NULL DEFAULT 'ERC-20',
    `valuationAmount` DECIMAL(65, 30) NULL,
    `valuationCurrency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `lastValuationDate` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'TOKENIZED', 'TRADING', 'SUSPENDED', 'DELISTED') NOT NULL DEFAULT 'DRAFT',
    `metadata` JSON NULL,
    `documents` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Asset_symbol_key`(`symbol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Investment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `investorId` INTEGER NOT NULL,
    `assetId` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `tokenAmount` DECIMAL(65, 30) NOT NULL,
    `pricePerToken` DECIMAL(65, 30) NOT NULL,
    `transactionHash` VARCHAR(191) NULL,
    `blockNumber` INTEGER NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `investedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KYCProfile` ADD CONSTRAINT `KYCProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KYBProfile` ADD CONSTRAINT `KYBProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DIDProfile` ADD CONSTRAINT `DIDProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerifiableCredential` ADD CONSTRAINT `VerifiableCredential_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SoulboundToken` ADD CONSTRAINT `SoulboundToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wallet` ADD CONSTRAINT `Wallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_issuerId_fkey` FOREIGN KEY (`issuerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_investorId_fkey` FOREIGN KEY (`investorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
