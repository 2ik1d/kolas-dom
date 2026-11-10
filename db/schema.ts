// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const content=sqliteTable('content',{id:text('id').primaryKey(),json:text('json').notNull()});
export const leads=sqliteTable('leads',{id:text('id').primaryKey(),name:text('name').notNull(),phone:text('phone').notNull(),comment:text('comment').notNull(),source:text('source').notNull(),estimate:text('estimate'),createdAt:integer('created_at').notNull(),ipHash:text('ip_hash').notNull(),status:text('status').notNull().default('new')});
export const adminSessions=sqliteTable('admin_sessions',{tokenHash:text('token_hash').primaryKey(),credentialVersion:text('credential_version').notNull(),expiresAt:integer('expires_at').notNull()});
export const loginAttempts=sqliteTable('login_attempts',{ipHash:text('ip_hash').primaryKey(),failures:integer('failures').notNull(),windowStart:integer('window_start').notNull(),lockedUntil:integer('locked_until').notNull().default(0)});
