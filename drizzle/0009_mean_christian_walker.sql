ALTER TABLE `project_inquiries` ADD `priority` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_inquiries` ADD `admin_note` text DEFAULT '' NOT NULL;