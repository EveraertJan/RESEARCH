/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable();
    table.string('name').notNullable();
    table.string('color1').defaultTo('#007AFF'); // Default blue color (primary)
    table.string('color2'); // Optional secondary color
    table.uuid('created_by').notNullable();
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('created_by').references('users.id').onDelete('CASCADE');
    table.unique(['project_id', 'name']); // Tag names must be unique per project
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tags');
};
