/**
 * Add table to capture used applications
 * MigrationName: AddTableUsedApplication
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('used_application', table => {
    table.string('application_name').notNullable();
    table.string('app_identifier').unique().notNullable();
    table.integer('app_category').notNullable();
    table.integer('duration_used').notNullable();
    table.string('icon_path').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('used_application');
};
