/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('projects', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('client');
    table.date('deadline');
    table.integer('owner_id').unsigned().notNullable();
    table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('projects');
};