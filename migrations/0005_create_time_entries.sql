-- Create time_entries table with construction-specific fields
CREATE TABLE IF NOT EXISTS `time_entries` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `business_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `project_id` int,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `description` text,
  `labor_type` enum('assembly','electrical','plumbing','carpentry','masonry','painting','roofing','other') NOT NULL,
  `is_overtime` boolean NOT NULL DEFAULT false,
  `regular_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `overtime_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  INDEX `idx_time_entries_employee_date` (`employee_id`, `date`),
  INDEX `idx_time_entries_project` (`project_id`),
  INDEX `idx_time_entries_labor_type` (`labor_type`),
  INDEX `idx_time_entries_is_overtime` (`is_overtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
