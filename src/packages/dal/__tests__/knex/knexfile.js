const CustomMigrationSource = require('./CustomMigrationSource');
const migrations = require('./migrations');

module.exports = {
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      migrationSource: new CustomMigrationSource(migrations),
    },
    seeds: {
      directory: './__tests__/knex/seeds',
    },
  },
};
