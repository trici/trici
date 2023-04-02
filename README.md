# trici


Trici is a desktop application that helps developers recover their lost train of thought in seconds instead of several minutes.


### Read this to understand the build process of each package in the monorepo 

Most of the packages in this monorepo are written in typescript. Here I am elborating on the build process, the tool choices and the build pipeline. 

There are different steps in the build pipeline. 
- Typechecking and generating types 
- Converting typescript to javascript
- Bundling 
- Running Tests

```
I am yet to decide whether all of the above steps should be combined into one build command which runs all of these steps or should it be separate. For now, I am going to keep them separate. 
```

We are using lerna to build the packages in our monorepo. To build all the packages, 

```
lerna run build-dev 
```

When the above script is run, it shall run the build-dev script for every package. Every package has a build-dev script which right now is doing the following: 

```
npm run build-types && npm run esbuild-dev
```

The build-dev script is cached by lerna so unless there are changes, it will not run everytime. For now, we are only building for dev builds so the prod build process, which shall not use esbuild but webpack is not documented. 


### Versioning

It is important to remember that when we run lerna version, those packages whose dependencies have changed will also get their version number changed. 


