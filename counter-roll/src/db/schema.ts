/**
 * The Counter-Roll — tables. Every table carries owner_id so a second person is a migration, not a rewrite.
 * Answers are stored raw (JSON). Computed scores are derived on read under whichever weight version is asked for.
 * Timestamps are ISO-8601 strings (sortable as text).
 */
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const owners = sqliteTable('owners', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
});

export const converterVersions = sqliteTable('converter_versions', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => owners.id),
  answers: text('answers', { mode: 'json' }).$type<Record<string, number>>().notNull(),
  /** strength under the weights active when the version was made; displays recompute from answers */
  k: real('k').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => [index('converter_versions_owner_created').on(t.ownerId, t.createdAt)]);

export const weightVersions = sqliteTable('weight_versions', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => owners.id),
  weights: text('weights', { mode: 'json' }).$type<WeightsJson>().notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('weight_versions_owner_created').on(t.ownerId, t.createdAt)]);

export const structures = sqliteTable('structures', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => owners.id),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => [index('structures_owner').on(t.ownerId)]);

export const placements = sqliteTable('placements', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => owners.id),
  structureId: text('structure_id').notNull().references(() => structures.id),
  answers: text('answers', { mode: 'json' }).$type<Record<string, number>>().notNull(),
  felt: integer('felt').notNull(),
  converterVersionId: text('converter_version_id').references(() => converterVersions.id),
  weightVersionId: text('weight_version_id').references(() => weightVersions.id),
  parentPlacementId: text('parent_placement_id'),
  createdAt: text('created_at').notNull(),
}, (t) => [
  index('placements_owner_created').on(t.ownerId, t.createdAt),
  index('placements_structure').on(t.structureId),
]);

export const reps = sqliteTable('reps', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => owners.id),
  act: text('act').notNull(),
  verbatim: text('verbatim'),
  level: real('level').notNull(),
  actTranslation: text('act_translation').notNull(),
  adjustment: text('adjustment').notNull(),
  ground: text('ground').notNull(),
  latencySec: integer('latency_sec').notNull(),
  converterVersionId: text('converter_version_id').references(() => converterVersions.id),
  createdAt: text('created_at').notNull(),
}, (t) => [index('reps_owner_created').on(t.ownerId, t.createdAt)]);

export interface WeightsJson {
  split: { copyShare: number; imposedShare: number };
  dims: Record<string, number>;
  converter: Record<string, number>;
}

export type OwnerRow = typeof owners.$inferSelect;
export type ConverterVersionRow = typeof converterVersions.$inferSelect;
export type WeightVersionRow = typeof weightVersions.$inferSelect;
export type StructureRow = typeof structures.$inferSelect;
export type PlacementRow = typeof placements.$inferSelect;
export type RepRow = typeof reps.$inferSelect;
