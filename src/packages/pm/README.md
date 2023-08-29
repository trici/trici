# `@trici/pm`

This package manages the communication between the primary and secondary main processes. There can be only one primary main process of Trici running. This is already enforced in the main.js of the desktop package by requesting a singleInstanceLock. The process which has the lock is the primary process. If other processes are started, they will not get the lock and thus shut down giving the focus to the primary process. 

The handling and control of having one primary process is handled in two ways. One is directly starting the electron process using the desktop icon or choosing the Trici application from the Spotlight. These actions try and start an electron main process. But because a primary instance of the main process already exists, the other processes starting by these actions/invocations will not get the lock and thus ideally should shut down. Starting a full fledged electron process is heavy on system resources and so we should avoid that as much as possible. At this time, I am not sure whether that can be completely achieved, i.e. whether we can completely avoid starting a second electron process, but I will assume that to be the default state going forward.

Even in the case that a second electron main process is started, it will not get the lock and shut down and give the focus back to the primary process. 

Over here when I refer to a primary process it means an electron main process. 

### How can a secondary process of Trici be started and what should happen in that case? 

A secondary process of trici is one that is not an electron main process but a separate CLI process that when run will do the following: 

- Try and establish a connection with the primary process using node-ipc UNIX/WINDOWS socket. 
- If it is able to establish a connect then a primary process exists and the secondary trici process should be able to talk to this and display output. 
    - For example, the CLI process should be able to start a focus session or mark a moment during the focus session. 
- If it is not able to establish a connect then a primary process does not exist and the secondary trici process then starts a primary process(spawned usign child_process) with the given arguments. 



### What is the role of this package @trici/pm

This package primarily start a node-ipc server when the primary process starts and then facilitates communication between the primary process and the secondary process. 


- I should be able to start 
