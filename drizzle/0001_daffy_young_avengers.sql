CREATE TABLE `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`credential_version` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`failures` integer NOT NULL,
	`window_start` integer NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
