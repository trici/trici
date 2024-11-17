class CustomMigrationSource {
  constructor(migrations) {
    this.migrations = migrations;
  }

  getMigrations() {
    return Promise.resolve(Object.keys(this.migrations));
  }

  getMigration(migrationName) {
    return Promise.resolve(this.migrations[migrationName]);
  }

  getMigrationName(migration) {
    return migration;
  }
}

module.exports = CustomMigrationSource;
