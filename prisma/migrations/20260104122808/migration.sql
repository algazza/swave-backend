/*
  Warnings:

  - The values [rumah,kantor,kos,sekolah,apartemen] on the enum `address_label` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `address` MODIFY `label` ENUM('Home', 'Office', 'School', 'Apartment') NOT NULL;
