module.exports = {
  test: {
    client: 'sqlite3',
    // the connection property has to be reset in the SqliteDbManager
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './__tests__/knex/migrations',
    },
    seeds: {
      directory: './__tests__/knex/seeds',
    },
  },
};
