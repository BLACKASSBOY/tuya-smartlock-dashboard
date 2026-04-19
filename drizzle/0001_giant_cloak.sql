CREATE TABLE `accessCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`passwordId` varchar(64) NOT NULL,
	`name` text,
	`code` text,
	`effectiveTime` timestamp,
	`expireTime` timestamp,
	`isFrozen` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accessCodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(32),
	`eventName` text,
	`eventTime` timestamp,
	`operateId` varchar(64),
	`operateName` text,
	`rawData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lockSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text,
	`lockTime` varchar(5),
	`daysOfWeek` varchar(20),
	`isEnabled` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lockSchedules_id` PRIMARY KEY(`id`)
);
