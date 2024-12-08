## Trici Activity Monitor (@trici/activmon)

This module is bascially the state machine which encapsulates the activity state transitions for the user. The state of user activity is determined by certain metrics which are sampled every 2 seconds(we may decide to change this in the future, however for our current purposes 2 seconds works fine. If we sample every 1 second, we will double the number of records we have to save alongwith the focus session, which seems like overkill at the moment.)

I am highlighting the key points here to remember whenever we think of this code. 

There are three metrics that determine the UserActivityState. They are as follows: 

1. idleTime: For how long has the user been idle for this sample. This leads to simple thresholds and if the idleTime crosses those thresholds then the state changes. For example, if the idleTime is greater than 600 seconds, then the user state goes to AWAY, meaning the user is away from the system. 

2. idleTimeDiff: This is the differnce in the idleTime between 2 samples. This lets us know when there has been a change in the usr activity. For example, if the user was away and came back the idleTimeDiff would be something greater than 600 while the idleTime would be 0 or 1. So this lets us know the user came back. 

3. For how long a user has been in a particular state: For example if the user has been in the becoming hyperactive state for a certain duration, then the user become hyper active. 


Earlier I was capturing when a user was becoming hyper_active etc. but now i am just using a the immediate history of the tricipings and its average to determine whether the user is active, becoming-hyper-active or hyper-active. This seems to be more accurate. 
