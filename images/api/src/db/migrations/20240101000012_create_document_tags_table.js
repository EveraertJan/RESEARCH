/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('document_tags', (table) => {
    table.uuid('document_id').notNullable();
    table.uuid('tag_id').notNullable();
    table.foreign('document_id').references('documents.id').onDelete('CASCADE');
    table.foreign('tag_id').references('tags.id').onDelete('CASCADE');
    table.primary(['document_id', 'tag_id']);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('document_tags');
};
