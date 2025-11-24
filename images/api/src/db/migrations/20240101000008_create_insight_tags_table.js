/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('insight_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('insight_id').notNullable();
    table.uuid('tag_id').notNullable();
    table.foreign('insight_id').references('insights.id').onDelete('CASCADE');
    table.foreign('tag_id').references('tags.id').onDelete('CASCADE');
    table.unique(['insight_id', 'tag_id']); // Prevent duplicate tag assignments
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('insight_tags');
};
