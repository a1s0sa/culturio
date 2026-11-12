CREATE TABLE `ingestion_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL REFERENCES `ingestion_runs`(`id`) ON DELETE CASCADE,
	`source` text NOT NULL,
	`external_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`result` text,
	`failure_reason` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer,
	UNIQUE(`run_id`, `source`, `external_id`)
);
--> statement-breakpoint
CREATE INDEX `ingestion_jobs_status_idx` ON `ingestion_jobs` (`status`);
--> statement-breakpoint
CREATE TABLE `ingestion_discovery_state` (
	`source` text PRIMARY KEY NOT NULL,
	`offset` integer DEFAULT 0 NOT NULL,
	`next_request_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
