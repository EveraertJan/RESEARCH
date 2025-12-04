/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 *
 * This table creates a many-to-many relationship between insights and documents
 * Allows insights to reference supporting documents
 */
exports.up = function(knex) {
  return knex.schema.createTable('insight_documents', (table) => {
    table.uuid('insight_id').notNullable();
    table.uuid('document_id').notNullable();
    table.foreign('insight_id').references('insights.id').onDelete('CASCADE');
    table.foreign('document_id').references('documents.id').onDelete('CASCADE');
    table.primary(['insight_id', 'document_id']);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('insight_documents');
};
