# `@trici/logger`

The logging service for Trici. This sends logs to a file as well as a remote endpoint which is our AWS endpoint. 

For the test environment, it is not sending logs to the remote endpoint as the tests were failing due to open handles. 

Still have to verify that the old functionality is working. But given the tests, I am confident that it will. 

For now, there is no separate logger for Electron renderer process. 


## Usage

```
const LoggingService = require('@trici/logger');

const logger = LoggingService.getLogger();

logger.info();
// TODO: DEMONSTRATE API
```
