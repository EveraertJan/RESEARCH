/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable();
    table.uuid('stack_id');
    table.uuid('user_id');
    table.text('message').notNullable();
    table.string('message_type').defaultTo('user'); // 'user', 'system', 'command'
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('stack_id').references('research_stacks.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('SET NULL');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('chat_messages');
};
