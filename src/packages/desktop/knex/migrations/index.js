const AddTableAppEventMigration = require('./20240321110114_001_addTableAppEvent');
const AddTableUsedApplicationMigration = require('./20240416102043_002_addTableUsedApplication');

module.exports = {
  '20240321110114_001_addTableAppEvent': AddTableAppEventMigration,
  '20240416102043_002_addTableUsedApplication': AddTableUsedApplicationMigration,
};
