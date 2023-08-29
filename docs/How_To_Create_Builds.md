## My thoughts on the process I will use to create builds from the dev code

My first objective is to create a build which I can use on the local machine. Earlier I was thinking of creating the builds directly from the @trici/desktop package but thanks to monorepo, the node_modules directory is not present in @trici/deskop so it is not packaged. Now I am using pnpm and because of that the node_modules directory does exist but does not have all the dependencies and the packager fails. Also, there is an open issue in appbuilder, a package used by electron packager, to support pnpm and monorepos because it does handle the case of symlinks etc. A PR has been opened for the same but I am not sure when that will be merged and even if it is merged whether it will solve all my issues. Also, I want the package.json of my packaged app to be clean and not show all the libraries, dependencies that I am using. Hence I have decided to use a separate repo. 

I will be creating a separate repo in the builds folder. This is outside of the workspaces used by pnpm so it will have its own dependencies. In fact, for it to have its own dependencies and not symlink, I will have to provide a value in the .npmrc so that pnpm creates a copy of all the dependencies in the node modules folder and not symlink. For pnpm to treat is as separate, I created a src folder at $PROJECT_ROOT and moved the code inside that. Now the builds folder I created has a separate pnmp lock file for its projects and is not considered a part of the workpaces. 


Now that the repo has been created, I have to create a script that will publish the built code from src to builds. First I will be implementing commands to build the code.


## IMPORTANT POINT TO REMEMBER
