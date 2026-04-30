CREATE DATABASE IF NOT EXISTS `tax_simulator_features`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `tax_simulator_features`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `dataset_files`;
DROP TABLE IF EXISTS `tax_allowance_kbli_2025`;
DROP TABLE IF EXISTS `tax_holiday_kbli_2025`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(80) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` ENUM('admin') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dataset_files` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` ENUM('tax_holiday','tax_allowance') NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(255) NULL,
  `record_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `uploaded_by` BIGINT UNSIGNED NULL,
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dataset_files_type_active` (`type`, `is_active`, `uploaded_at`),
  CONSTRAINT `fk_dataset_files_uploaded_by`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tax_allowance_kbli_2025` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_row` INT UNSIGNED NOT NULL,
  `excel_no` INT UNSIGNED NULL,
  `lokasi` VARCHAR(120) NULL,
  `kawasan_industri` VARCHAR(255) NULL,
  `jenis_industri_kbli_2025` VARCHAR(255) NULL,
  `bidang_usaha_kbli_2025` VARCHAR(255) NULL,
  `kode_kbli_2025` VARCHAR(255) NULL,
  `kode_kbli_2020_lama` VARCHAR(255) NULL,
  `tipe_perubahan` VARCHAR(120) NULL,
  `cakupan` LONGTEXT NULL,
  `nilai_min_investasi_baru` DECIMAL(20,2) NULL,
  `nilai_min_perluasan` DECIMAL(20,2) NULL,
  `syarat` LONGTEXT NULL,
  `tax_allowance` LONGTEXT NULL,
  `insentif_tambahan` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_allowance_lokasi` (`lokasi`),
  KEY `idx_allowance_bidang` (`bidang_usaha_kbli_2025`),
  KEY `idx_allowance_kawasan` (`kawasan_industri`),
  KEY `idx_allowance_kbli` (`kode_kbli_2025`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tax_holiday_kbli_2025` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_row` INT UNSIGNED NOT NULL,
  `lokasi` VARCHAR(120) NULL,
  `kawasan_industri` VARCHAR(255) NULL,
  `jenis_industri` VARCHAR(255) NULL,
  `kbli_2025_source` VARCHAR(255) NULL,
  `cakupan` LONGTEXT NULL,
  `jenis_tax_holiday` VARCHAR(120) NULL,
  `jangka_waktu` VARCHAR(80) NULL,
  `nilai_investasi_minimum` DECIMAL(20,2) NULL,
  `nilai_investasi_maksimum` DECIMAL(20,2) NULL,
  `syarat` LONGTEXT NULL,
  `summary` LONGTEXT NULL,
  `detail_insentif` LONGTEXT NULL,
  `insentif_tambahan` LONGTEXT NULL,
  `kode_kbli_2025` VARCHAR(255) NULL,
  `judul_kbli_2025` VARCHAR(255) NULL,
  `sifat_kesesuaian` VARCHAR(120) NULL,
  `keterangan_revisi` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_holiday_lokasi` (`lokasi`),
  KEY `idx_holiday_jangka` (`jangka_waktu`),
  KEY `idx_holiday_kbli` (`kode_kbli_2025`),
  KEY `idx_holiday_kawasan` (`kawasan_industri`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`username`, `password_hash`, `full_name`, `role`, `is_active`)
VALUES (
  'admin',
  'scrypt$16384$8$1$tax-simulator-initial-admin$ad059edbcc399dddfce2e228f239d07ac06cea8edf99b35658dd3b42d6d2143b2d15a214f6b1e509f7a3bf2702199bbbfa6cee6e01cb75f7b74d88da3ff1f621',
  'Administrator',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `full_name` = VALUES(`full_name`),
  `is_active` = 1;
