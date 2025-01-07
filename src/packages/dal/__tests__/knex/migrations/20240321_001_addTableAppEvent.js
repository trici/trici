/**
 * Add table to capture used applications
 * MigrationName: addTableAppEvent
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('app_event', table => {
    table.uuid('id').primary();
    table.string('type').notNullable();
    table.text('data').notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('app_event');
};
