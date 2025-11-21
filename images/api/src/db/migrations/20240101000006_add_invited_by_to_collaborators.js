/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('project_collaborators', (table) => {
    table.integer('invited_by').unsigned().nullable();
    table.foreign('invited_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('project_collaborators', (table) => {
    table.dropForeign(['invited_by']);
    table.dropColumn('invited_by');
  });
};