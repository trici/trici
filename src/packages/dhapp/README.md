@trici/dhapp

Data Handling and Processing Pipeline

## About 

The data handling and processing pipeline is where the data of Focus Session is processed, once a chunk is written and also at the end 
after the session is over. 


The DhappService has two components: the Pipeline and the PickupService. (I am not sure about the utility of the PickupService right now. I had added it to automatically scan the directories to automatically queue a job for that directory which has not been processed. (Is there a way to figure out whether a directory has been processed? Yes, but what is it?))

The Pipeline is like an assembly line, where the jobs are queued and then handled. 

When a Focus Session ends, a job is queued by calling the Pipeline. Once a job has been queued, then its status keep tracks of whether the job has been processed completely. The handle job method will take care of processing the job. 


#### How am I testing this? 

I have added the sampledata. So now I have to test, queuing of the job, and handling of the job. How are these tested? 
