-- Create courses table for Education module
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration_weeks` INT,
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create students table
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) UNIQUE,
  `phone` VARCHAR(50),
  `address` TEXT,
  `date_of_birth` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `enrollment_date` DATE NOT NULL,
  `completion_date` DATE,
  `status` ENUM('active', 'completed', 'dropped', 'on_hold') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_enrollment` (`course_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance table
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('present', 'absent', 'late', 'excused') NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`enrollment_id`) REFERENCES `course_enrollments`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_attendance` (`enrollment_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create chart_of_accounts table for Accounting module
CREATE TABLE IF NOT EXISTS `chart_of_accounts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `account_code` VARCHAR(20) NOT NULL,
  `account_name` VARCHAR(100) NOT NULL,
  `account_type` ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
  `parent_id` INT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_account_code` (`business_id`, `account_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create general_ledger table
CREATE TABLE IF NOT EXISTS `general_ledger` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `account_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `reference_type` VARCHAR(50),
  `reference_id` INT,
  `description` TEXT,
  `debit` DECIMAL(15, 2) DEFAULT 0.00,
  `credit` DECIMAL(15, 2) DEFAULT 0.00,
  `balance` DECIMAL(15, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE CASCADE,
  INDEX `idx_ledger_date` (`date`),
  INDEX `idx_ledger_reference` (`reference_type`, `reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `account_name` VARCHAR(100) NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(50) NOT NULL,
  `account_type` VARCHAR(50),
  `currency` CHAR(3) DEFAULT 'USD',
  `opening_balance` DECIMAL(15, 2) DEFAULT 0.00,
  `current_balance` DECIMAL(15, 2) DEFAULT 0.00,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_account_number` (`business_id`, `account_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create email_intelligence table
CREATE TABLE IF NOT EXISTS `email_intelligence` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `email_id` VARCHAR(255) NOT NULL,
  `subject` TEXT,
  `from_address` VARCHAR(255) NOT NULL,
  `to_address` TEXT NOT NULL,
  `cc_addresses` TEXT,
  `bcc_addresses` TEXT,
  `body` LONGTEXT,
  `sent_at` DATETIME,
  `received_at` DATETIME NOT NULL,
  `category` VARCHAR(50),
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `status` ENUM('new', 'processing', 'processed', 'error') DEFAULT 'new',
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_email_category` (`category`),
  INDEX `idx_email_status` (`status`),
  INDEX `idx_email_dates` (`received_at`, `sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create assistant_sessions table
CREATE TABLE IF NOT EXISTS `assistant_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `user_id` INT,
  `session_id` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255),
  `context` TEXT,
  `status` ENUM('active', 'completed', 'archived') DEFAULT 'active',
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_session` (`business_id`, `session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create voice_commands table
CREATE TABLE IF NOT EXISTS `voice_commands` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `user_id` INT,
  `session_id` VARCHAR(100),
  `command_text` TEXT NOT NULL,
  `intent` VARCHAR(100),
  `confidence` FLOAT,
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `response` TEXT,
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_voice_intent` (`intent`),
  INDEX `idx_voice_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS `ai_insights` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `insight_type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `data` JSON,
  `confidence` FLOAT,
  `status` ENUM('new', 'reviewed', 'actioned', 'archived') DEFAULT 'new',
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_insight_type` (`insight_type`),
  INDEX `idx_insight_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create predictive_models table
CREATE TABLE IF NOT EXISTS `predictive_models` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `model_type` VARCHAR(50) NOT NULL,
  `version` VARCHAR(50) NOT NULL,
  `status` ENUM('training', 'active', 'inactive', 'error') DEFAULT 'inactive',
  `metrics` JSON,
  `parameters` JSON,
  `storage_path` TEXT,
  `last_trained_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_model_version` (`business_id`, `name`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
