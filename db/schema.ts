import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  revision: integer('revision').notNull().default(1),
  createdAt: text('created_at').notNull(),
});
export const accounts = sqliteTable('accounts', {
 userId: text('user_id').primaryKey(), username: text('username').notNull().unique(),
 role: text('role').notNull().default('member'),
 salt: text('salt').notNull(), passwordHash: text('password_hash').notNull(),
});
export const sessions = sqliteTable('sessions', {
 tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull(),
 expiresAt: integer('expires_at').notNull(),
});
export const loginLimits = sqliteTable('login_limits', {
 userId: text('user_id').primaryKey(), attempts: integer('attempts').notNull(),
 windowStart: integer('window_start').notNull(),
});
export const customers = sqliteTable('customers', {
 id: text('id').primaryKey(), nameKey: text('name_key').notNull().unique(),
 data: text('data').notNull(), revision: integer('revision').notNull().default(1),
 createdAt: text('created_at').notNull(),
});

export const taskNotes = sqliteTable('task_notes', {
 userId: text('user_id').notNull(), kind: text('kind').notNull(),
 content: text('content').notNull(), revision: integer('revision').notNull().default(1),
 updatedAt: text('updated_at').notNull(),
}, table=>[primaryKey({columns:[table.userId,table.kind]})]);

export const loginEvents=sqliteTable('login_events',{
 id:text('id').primaryKey(),userId:text('user_id'),email:text('email'),
 username:text('username').notNull(),action:text('action').notNull(),
 outcome:text('outcome').notNull(),reason:text('reason').notNull(),
 ipAddress:text('ip_address'),requestDetails:text('request_details'),occurredAt:integer('occurred_at').notNull(),
},table=>[index('login_events_occurred_at_idx').on(table.occurredAt)]);

export const invitations=sqliteTable('invitations',{
 tokenHash:text('token_hash').primaryKey(),createdBy:text('created_by').notNull(),
 role:text('role').notNull().default('member'),
 expiresAt:integer('expires_at').notNull(),usedBy:text('used_by'),
});

export const sharedViews=sqliteTable('shared_views',{
 id:text('id').primaryKey(),tokenHash:text('token_hash').notNull().unique(),
 createdBy:text('created_by').notNull(),kind:text('kind').notNull(),
 snapshot:text('snapshot').notNull(),createdAt:integer('created_at').notNull(),
 expiresAt:integer('expires_at').notNull(),revoked:integer('revoked').notNull().default(0),
});

export const projectMessages=sqliteTable('project_messages',{
 id:text('id').primaryKey(),projectId:text('project_id').notNull(),userId:text('user_id').notNull(),
 author:text('author').notNull(),content:text('content').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('messages_project_time_idx').on(t.projectId,t.createdAt)]);
export const statusUpdates=sqliteTable('status_updates',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),author:text('author').notNull(),
 content:text('content').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('updates_user_time_idx').on(t.userId,t.createdAt)]);
export const attachments=sqliteTable('attachments',{
 id:text('id').primaryKey(),scope:text('scope').notNull(),resourceId:text('resource_id').notNull(),
 userId:text('user_id').notNull(),name:text('name').notNull(),mime:text('mime').notNull(),
 bytes:integer('bytes').notNull(),extractedText:text('extracted_text').notNull(),
 extraction:text('extraction').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('attachments_scope_resource_idx').on(t.scope,t.resourceId)]);
