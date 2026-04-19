CREATE TABLE `cliTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`name` text,
	`isActive` int DEFAULT 1,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `cliTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `cliTokens_token_unique` UNIQUE(`token`)
);
