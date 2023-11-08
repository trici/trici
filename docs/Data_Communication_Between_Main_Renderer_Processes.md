## How do the Main and Renderer Processes communicate and pass data. 


#### Query Parameters

When loading a file, we can specify query parameters. E.g. specifying which window is being opened for index.html 

```
    this.settingsWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), { query: { type: 'settings' } });
```

These values are available even before the react app loads. 


#### Init Values

These values are basically the initial state values that are passed to the react app. For example, which is the settings section that should be opened. 
