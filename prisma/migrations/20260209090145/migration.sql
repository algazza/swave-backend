/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `address` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `categories` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `variants` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX `products_name_key` ON `products`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `products_slug_key` ON `products`(`slug`);
