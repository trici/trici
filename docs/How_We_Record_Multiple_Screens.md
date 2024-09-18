# How and why we record multiple screens

## Overview
Many developers use at leas two screens while working. While this has been contested with anecdotal evidence that many just use their laptops for work, when I went out asking other developers to use the Trici app, many ended up dropping off because the ability to record multiple screens was not available. While it may be true that a majority of developers use just a single screen, are these the developers who are going to try to use Trici? In reality, I found that the developers who would try out Trici were the ones who also used multiple screens. Which is why its important to handle this scenario.

## Why do we record multiple screens?

In the new version of Trici, we are going to add the functionality of detecting whether a user has started working and auto starting a Focus Session. To do this, I need to know that if the user is using a browser, then which is the website they are browsing. Based on that website I can detect whether the user is working or not. If the user is using multiple screens, then to know which url the user is browsing, I need to record whicever screen they are on.

## How do we record multiple screens?

Right now, recording the active screen among multiple screens has been implemented only on MacOS. This should be possible to implment on other platforms as well but may be complicated. On macOS, we are using the ScreenCaptureKit framework to record the active screen. Whichever is the active screen, we record it and if the active screen changes we update the configuration we are using to record the stream.

The main thing I wanted to write here was that if I specify ScreenCaptureKit to capture at 7fps, it is not necessary that a constant stream of frames is written. When the system is under load and if we are updating the configuration, we most likely will experience a drop in frame rate. Since our swift console app writes raw data to a named pipe, the raw data does not have timestamps and thus we need to tell ffmpeg to generate timestamps for the frames. Only if we do this, do we get a consistent duration of the video. 


