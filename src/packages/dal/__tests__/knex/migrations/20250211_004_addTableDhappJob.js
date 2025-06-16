/**
 * Add table to capture focus sessions
 * MigrationName: addTableFocusSession
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('dhapp_job', table => {
    table.increments('id').primary().notNullable();
    table.string('job_session_directory').notNullable();
    table.string('job_name').notNullable().unique();
    table.string('job_type').notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).notNullable();
    table.json('steps_completed').notNullable();
    table.string('error_message').nullable();
    table.integer('attempt_count').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('dhapp_job');
};
