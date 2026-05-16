## How Playwright based BDD testing works here

We are using two agent skills "feature-file-author" and "feature-to-playwright-bdd-steps" to generate features and step files based on the input given by me on what to test. 

The tests are synced to the builds/darwin folder using the syncTestsToBuild.js script.

If there is a change in the source code of the build, then the code at trici/desktop has to be rebuilt-for-packaging. This copies the updated files to the builds/darwin folder. Then in the builds/darwin folder, the test app has to be packaged. Then only can we run the test suite. 
