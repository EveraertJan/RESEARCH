/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('project_collaborators', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('role').defaultTo('collaborator');
    table.timestamps(true, true);
    
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.unique(['project_id', 'user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('project_collaborators');
};