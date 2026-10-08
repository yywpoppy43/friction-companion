CREATE TABLE `converter_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`answers` text NOT NULL,
	`k` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `converter_versions_owner_created` ON `converter_versions` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `owners` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `placements` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`structure_id` text NOT NULL,
	`answers` text NOT NULL,
	`felt` integer NOT NULL,
	`converter_version_id` text,
	`weight_version_id` text,
	`parent_placement_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`structure_id`) REFERENCES `structures`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`converter_version_id`) REFERENCES `converter_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`weight_version_id`) REFERENCES `weight_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `placements_owner_created` ON `placements` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `placements_structure` ON `placements` (`structure_id`);--> statement-breakpoint
CREATE TABLE `reps` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`act` text NOT NULL,
	`verbatim` text,
	`level` real NOT NULL,
	`act_translation` text NOT NULL,
	`adjustment` text NOT NULL,
	`ground` text NOT NULL,
	`latency_sec` integer NOT NULL,
	`converter_version_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`converter_version_id`) REFERENCES `converter_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reps_owner_created` ON `reps` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `structures` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `structures_owner` ON `structures` (`owner_id`);--> statement-breakpoint
CREATE TABLE `weight_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`weights` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `weight_versions_owner_created` ON `weight_versions` (`owner_id`,`created_at`);