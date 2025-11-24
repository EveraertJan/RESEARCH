/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('image_tags', (table) => {
    table.uuid('image_id').notNullable();
    table.uuid('tag_id').notNullable();
    table.foreign('image_id').references('images.id').onDelete('CASCADE');
    table.foreign('tag_id').references('tags.id').onDelete('CASCADE');
    table.primary(['image_id', 'tag_id']);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('image_tags');
};
