ALTER TABLE `sandbox_orders` ADD `reference` text;
--> statement-breakpoint
ALTER TABLE `sandbox_orders` ADD `report_id` text;
--> statement-breakpoint
ALTER TABLE `sandbox_orders` ADD `entitlement_key` text;
--> statement-breakpoint
ALTER TABLE `sandbox_orders` ADD `status_detail` text DEFAULT 'Awaiting sandbox confirmation.' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sandbox_orders` ADD `updated_at` integer;
--> statement-breakpoint
ALTER TABLE `sandbox_orders` ADD `fulfilled_at` integer;
--> statement-breakpoint
UPDATE `sandbox_orders`
SET
  `reference` = 'sndb_' || substr(replace(id, '-', ''), 1, 12),
  `entitlement_key` = CASE
    WHEN `plan` = 'done-for-you' THEN 'consultation'
    ELSE 'full_audit'
  END,
  `status_detail` = CASE
    WHEN `status` = 'test_paid' THEN 'Sandbox payment confirmed. Premium delivery unlocked.'
    ELSE 'Awaiting sandbox confirmation.'
  END,
  `updated_at` = `created_at`,
  `fulfilled_at` = CASE WHEN `status` = 'test_paid' THEN `created_at` ELSE NULL END
WHERE `reference` IS NULL OR `entitlement_key` IS NULL OR `updated_at` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `sandbox_orders_reference_idx` ON `sandbox_orders` (`reference`);
