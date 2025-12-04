/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').nullable(); // Nullable to allow cross-project references
    table.uuid('stack_id').nullable(); // Nullable to allow cross-project references
    table.string('name').notNullable();
    table.text('description'); // Optional description for the document
    table.string('file_path').notNullable();
    table.string('mime_type');
    table.integer('file_size');
    table.uuid('created_by').notNullable();
    table.foreign('project_id').references('projects.id').onDelete('SET NULL');
    table.foreign('stack_id').references('research_stacks.id').onDelete('SET NULL');
    table.foreign('created_by').references('users.id').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('documents');
};
