const AddTableAppEventMigration = require('./20240321_001_addTableAppEvent');
const AddTableUsedApplicationMigration = require('./20240416_002_addTableUsedApplication');
const AddTableFocusSessionMigration = require('./20250105_003_addTableFocusSession');

module.exports = {
  '20240321_001_addTableAppEvent': AddTableAppEventMigration,
  '20240416_002_addTableUsedApplication': AddTableUsedApplicationMigration,
  '20250105_003_addTableFocusSession': AddTableFocusSessionMigration,
};
