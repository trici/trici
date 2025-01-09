## How do the Main and Renderer Processes communicate and pass data. 


#### Query Parameters

When loading a file, we can specify query parameters. E.g. specifying which window is being opened for index.html 

```
    this.settingsWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), { query: { type: 'settings' } });
```

These values are available even before the react app loads. 


#### Init Values

These values are basically the initial state values that are passed to the react app. For example, which is the settings section that should be opened. 


#### Fetching Data from the Main process

There are different types of data that we can fetch from the main process. The first differentiation in how we fetch data depends on the type of data that we are fetching. If we are fetching something which is not stored in the db, the process currently is to build a separate bridge API method for that. For example, to fetch the appPath or the triciConfig we call the ipcRenderer.sendSync and get these values. 

The other case is where we are fetching data from the db. For this we send a queryMessage to the main process and then handle the response. 

There are different ways in which we handle the response in the react component tree. The main point to document here is what are the different ways in which we handle the response and why: 

1. Using react-query: In the case of Settings window, we are using react-query. This is because in the case of Settings Window, we change the data and then the data has to be saved and the updated data shown. In the old code, the data was part of a store. So when the data was saved, it was updated in the store as well and the complete react app/tree had the updated data. Now we are not using flux so there is no store. The store has been replaced by react-query. So when we update the data, we just invalidate the current query, which forces react-query to fetch the updated data from the main process/server.  

2. In the case of Onboarding Wizard, we are using only one component and there is no component tree. Perhaps (I am not sure) this is why I am not using react-query because there is no equivalent store like structure. Here there is only one component and when a data is saved, the main process sends a response with the updated data which is then saved in the state. I am not sure which is better. 
