const path = require('path');
const CustomMigrationSource = require('./knex/CustomMigrationSource');
const CustomSeedSource = require('./knex/CustomSeedSource');

// Import migrations and seeds
const migrations = require('./knex/migrations');
const seeds = require('./knex/seeds');

// Helper function to create config
const createConfig = () => ({
  client: 'sqlite3',
  connection: {
    filename: ':memory:',
  },
  useNullAsDefault: true,
  migrations: {
    migrationSource: new CustomMigrationSource(migrations),
  },
  seeds: {
    seedSource: new CustomSeedSource(seeds),
  },
});

module.exports = {
  development: createConfig(),
  livedev: createConfig(),
  production: createConfig(),
  test: createConfig(),
};
