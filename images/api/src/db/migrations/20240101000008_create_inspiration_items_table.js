/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('inspiration_items', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('image_path');
    table.boolean('is_vital').defaultTo(false);
    table.integer('linked_finding_id').unsigned().nullable();
    table.timestamps(true, true);
    
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('linked_finding_id').references('id').inTable('research_findings').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('inspiration_items');
};