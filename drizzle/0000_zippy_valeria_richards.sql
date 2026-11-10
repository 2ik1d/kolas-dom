CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`comment` text NOT NULL,
	`source` text NOT NULL,
	`estimate` text,
	`created_at` integer NOT NULL,
	`ip_hash` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);
