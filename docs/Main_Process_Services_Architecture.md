## How do the destkop Services of the main process interact with eacg other

The primary thing that I want to document here is the services interacting with each other via actions and events. 

Actions are dispatched on user interactions like start a Focus Session. Action is different from AppEvent because Start a Focus Session will result in an event called FOCUS_SESSION_STARTED.  
