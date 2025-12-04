/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 *
 * This table tracks references/links between documents and projects
 * Allows documents to be referenced across multiple projects
 */
exports.up = function(knex) {
  return knex.schema.createTable('document_references', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('document_id').notNullable();
    table.uuid('project_id').notNullable();
    table.uuid('stack_id').nullable(); // Optional - can be linked to a specific stack
    table.uuid('added_by').notNullable(); // User who added this reference
    table.foreign('document_id').references('documents.id').onDelete('CASCADE');
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('stack_id').references('research_stacks.id').onDelete('CASCADE');
    table.foreign('added_by').references('users.id').onDelete('CASCADE');
    table.unique(['document_id', 'project_id', 'stack_id']); // Prevent duplicate references
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('document_references');
};
