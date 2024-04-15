module.exports = {
  development: {
    client: 'sqlite3',
    // the connection property has to be reset in the SqliteDbManager
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './knex/migrations',
    },
    seeds: {
      directory: './knex/seeds',
    },
  },
  livedev: {
    client: 'sqlite3',
    // the connection property has to be reset in the SqliteDbManager
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './knex/migrations',
    },
    seeds: {
      directory: './knex/seeds',
    },
  },
  test: {
    client: 'sqlite3',
    // the connection property has to be reset in the SqliteDbManager
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './knex/migrations',
    },
    seeds: {
      directory: './knex/seeds',
    },
  },
};
