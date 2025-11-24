/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('insights', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('stack_id').notNullable();
    table.text('content').notNullable();
    table.uuid('created_by').notNullable();
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
  return knex.schema.dropTable('insights');
};
