/**
 * Add table to capture focus sessions
 * MigrationName: addTableFocusSession
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('focus_session', table => {
    table.bigInteger('id').primary();
    table.bigInteger('start_time').notNullable();
    table.bigInteger('end_time').defaultTo(0);
    table.string('name').defaultTo('');
    table.boolean('session_did_start').notNullable();
    table.boolean('recording_process_crashed_on_start').defaultTo(false);
    table.json('display_units').notNullable();
    table.boolean('should_have_recording').defaultTo(true);
    table.string('started_by').notNullable();
    table.string('started_from').notNullable();
    table.json('session_start_metadata').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('focus_session');
};
