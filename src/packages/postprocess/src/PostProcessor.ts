import type { Logger, IConsoleLogger } from "@trici/logger";
import fs from "fs";
import child_process from "child_process";
import { compareImages } from "@trici/imageutils";

export interface IPostProcessor {
  process(
    recordingFileName: string,
    recordingsDirPath: string,
    processedImagesDestinationPath: string,
    eventTimestamps: Array<number>
  ): Promise<void>;
}

export class PostProcessor implements IPostProcessor {
  #ffmpegBinPath: string;
  logger: Logger | IConsoleLogger;

  constructor(ffmpgBinPath: string, logger: Logger | IConsoleLogger) {
    this.#ffmpegBinPath = ffmpgBinPath;
    this.logger = logger;
  }

  async processFiles(fileNames: string[]) {
    return new Promise((resolve, reject) => {});
  }

  async process(
    recordingFileName: string,
    recordingsDirPath: string,
    processedImagesDestinationPath: string,
    eventTimestamps: Array<number>
  ): Promise<void> {
    let fileNames = fs
      .readdirSync(recordingsDirPath)
      .filter((fileName) => fileName.startsWith(recordingFileName))
      .sort();
    const frameRate = 7;
    const startTime = parseInt(recordingFileName);
    const videoDuration = 5000;

    let childProcessPromises: Promise<void>[]= [];

    fileNames.forEach((fileName, index) => {
      //Calculate the start and end times for this video segment
      let videoStart = startTime + index * videoDuration;
      let videoEnd = videoStart + videoDuration;

      // Find all regular timestamps within the video's duration
      let regularTimestamps: number[] = [];
      for (let i = Math.ceil(videoStart / 3000) * 3000; i < videoEnd; i += 3000) {
        regularTimestamps.push(i);
      }
      // Find all event timestamps within the video's duration
      let eventTimestampsInVideo: number[] = eventTimestamps.filter((t) => t >= videoStart && t < videoEnd);

      // Combine all timestamps, remove duplicates, and sort
      let allTimestamps = Array.from(new Set([...regularTimestamps, ...eventTimestampsInVideo])).sort();
      // console.log("All timestamps: ", allTimestamps);
      // Convert timestamps to frame numbers and extract frames
      allTimestamps.forEach((timestamp) => {
        let frameNumber = Math.round(((timestamp - videoStart) / 1000) * frameRate);
        // Check if this timestamp is from an event or a regular interval
        let prefix = regularTimestamps.includes(timestamp) ? "regular" : "event";
        let outputFilename = `${processedImagesDestinationPath}/${prefix}_output_${timestamp}.png`;
        let fileNameWithLocation = `${recordingsDirPath}/${fileName}`;
        let args = [
          "-i",
          fileNameWithLocation,
          "-vf",
          `select='eq(n\\,${frameNumber})'`,
          "-vsync",
          "vfr",
          outputFilename,
        ];
        console.log(args);
        let promise: Promise<void> = new Promise((resolve, reject) => {
          let proc = child_process.spawn(this.#ffmpegBinPath, args);

          proc.stdout.on("data", (data) => {
            // console.log(`stdout: ${data}`);
          });

          proc.stderr.on("data", (data) => {
            // console.error(`stderr: ${data}`);
          });

          proc.on("close", (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
              resolve();
            } else {
              reject(`child process exited with code ${code}`);
            }
          });
        });
        childProcessPromises.push(promise);
      });
    });
    try{
      await Promise.all(childProcessPromises);
      console.log("All child processes completed");
    } catch (e) {
      console.log(e);
    }
    // After extracting frames
    // Get all regular image files
    let regularImageFiles = fs
      .readdirSync(processedImagesDestinationPath)
      .filter((fileName) => fileName.startsWith("regular"))
      .sort();

    let imageGroups: string[][] = [];
    let currentGroup: string[] = [];

    for (let i = 0; i < regularImageFiles.length - 1; i++) {
      let image1 = `${processedImagesDestinationPath}/${regularImageFiles[i]}`;
      let image2 = `${processedImagesDestinationPath}/${regularImageFiles[i + 1]}`;

      let distance = await compareImages(image1, image2);

      currentGroup.push(regularImageFiles[i]);

      // If the images are not similar (tune the threshold as per your requirements)
      if (distance > 10) {
        // Add the current group to the list of groups and start a new group
        imageGroups.push(currentGroup);
        currentGroup = [];
      }
    }

    // Don't forget to add the last group and the last image
    if (currentGroup.length > 0) {
      currentGroup.push(regularImageFiles[regularImageFiles.length - 1]);
      imageGroups.push(currentGroup);
    } else {
      imageGroups.push([regularImageFiles[regularImageFiles.length - 1]]);
    }

    console.log(imageGroups);
  }
}
