## How the testing of the build happens

To test a build, first you have to pack the build to create a package. After that, you run the test command and that command deletes existing data and directories for the test build and then goes onto copy the test build to the applications folder and then runs tests assuming that the application is installed. 

The npm run command package is used only for test builds, which is why we can pass BUILD_ENV=test when running that command. For actually packaging and publishing, electron-forge make and publish commands are used without BUILD_ENV=test. These commands will anyway repackage the app. 
