/**
 * Textractor.
 * @description This module is responsible for extracting text from images.
 */

import { createWorker, createScheduler } from "tesseract.js";
import path from "path";
import config from '@trici/config';
const spawn = require("child_process").spawn;

export enum OCRLib {
  TESSERACT = "TESSERACT",
  VISIONKIT = "VISIONKIT",
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecognizedText {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface ITextractor {
  initialize(): Promise<void>;
  extract(image: string, OCRLib: OCRLib, rootDirectory: string): Promise<RecognizedText[]>;
}

export class Textractor implements ITextractor {
  workers: any[];
  scheduler: any;
  initialized: boolean;

  constructor() {
    this.workers = [];
    this.scheduler = createScheduler();
    this.initialized = false;
  }

  async initialize(numWorkers = 4): Promise<void> {
    if (!this.initialized) {
      for (let i = 0; i < numWorkers; i++) {
        const worker = await createWorker({
          // logger: (m) => console.log(m),
        });
        this.workers.push(worker);
      }
      for (const worker of this.workers) {
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        this.scheduler.addWorker(worker);
      }
      this.initialized = true;
    }
  }

  async extract(image: string, ocrLib: OCRLib, rootDirectory: string): Promise<RecognizedText[]> {
    if (!this.initialized) {
      throw new Error("Textractor not initialized");
    }
    if (ocrLib === OCRLib.TESSERACT) {
      // Perform OCR with Tesseract
      try {
        console.log("Extracting text from image")
        const result = await this.scheduler.addJob("recognize",image);
        console.log("Text extracted from image")
        const { data: { text, blocks, paragraphs, lines, words, symbols } } = result;
        // fs.writeFileSync("lines.json", JSON.stringify(result.data.lines, null, 2));
        let recognizedTexts: RecognizedText[] = [];
        recognizedTexts = result.data.lines.map((line: any) => {
          const boundingBox: BoundingBox = {
            x: line.bbox.x0,
            y: line.bbox.y0,
            width: line.bbox.x1 - line.bbox.x0,
            height: line.bbox.y1 - line.bbox.y0,
          };
          return {
            text: line.text,
            confidence: line.confidence,
            boundingBox,
          };
        });
        return recognizedTexts;
      } catch (error) {
        throw error;
      }
    } else if (ocrLib === OCRLib.VISIONKIT) {
      // TODO: Call textract mac binary which uses visionkit
      let binaryLocation = "";
      if ( config.builtFor === "dev" ) {
        binaryLocation = path.join(rootDirectory, "bin", "dev", "Textractor");
      } else {
        binaryLocation = path.join(rootDirectory, "bin", "Textractor");
      }
      const child = spawn(binaryLocation, [image]);
      let recognizedTexts: RecognizedText[] = [];
      child.stdout.on("data", (data: any) => {
        console.log(`stdout: ${data.toString('utf8')}`);
        // const lines = JSON.parse(data.toString('utf8'));
        // console.log("lines", lines);

        // lines.forEach((line: string) => {
        //   const [text, confidence, x, y, width, height] = line.split(",");
        //   const boundingBox: BoundingBox = {
        //     x: parseInt(x),
        //     y: parseInt(y),
        //     width: parseInt(width),
        //     height: parseInt(height),
        //   };
        //   recognizedTexts.push({
        //     text,
        //     confidence: parseFloat(confidence),
        //     boundingBox,
        //   });
        // });
      });
      child.stderr.on("data", (data: any) => {
        console.log(`stderr: ${data}`);
      });
      child.on("error", (error: any) => {
        console.log(`error: ${error.message}`);
      });
      child.on("close", (code: any) => {
        console.log(`child process exited with code ${code}`);
      });
      return recognizedTexts;
    } else {
      throw new Error("Invalid OCR library");
    }
    return [];
  }
}
