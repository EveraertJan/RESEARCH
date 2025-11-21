/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('project_sections', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.string('section_type').notNullable(); // 'research', 'inspiration', 'sketches', 'technologies'
    table.text('content');
    table.string('title');
    table.timestamps(true, true);
    
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('project_sections');
};