/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('project_sections', (table) => {
    table.integer('last_updated_by').unsigned().nullable();
    table.foreign('last_updated_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('project_sections', (table) => {
    table.dropForeign(['last_updated_by']);
    table.dropColumn('last_updated_by');
  });
};