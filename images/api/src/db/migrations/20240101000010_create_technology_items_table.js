/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('technology_items', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.string('url');
    table.string('document_path');
    table.boolean('is_vital').defaultTo(false);
    table.boolean('is_rented').defaultTo(false);
    table.decimal('amount_per_unit', 8, 2).nullable();
    table.string('unit').nullable();
    table.timestamps(true, true);
    
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('technology_items');
};