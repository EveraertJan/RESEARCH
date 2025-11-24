/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable();
    table.uuid('stack_id').notNullable();
    table.string('name').notNullable();
    table.string('file_path').notNullable();
    table.string('mime_type');
    table.integer('file_size');
    table.uuid('created_by').notNullable();
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('stack_id').references('research_stacks.id').onDelete('CASCADE');
    table.foreign('created_by').references('users.id').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('images');
};
