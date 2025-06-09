/**
 * Textractor.
 * @description This module is responsible for extracting text from images.
 */

import path from 'path';
import config from '@trici/config';
import { IConsoleLogger, Logger } from '@trici/logger';
const spawn = require('child_process').spawn;

export enum OCRLib {
  WINDOWS = 'WINDOWS',
  VISIONKIT = 'VISIONKIT',
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
  extract(image: string, OCRLib: OCRLib, rootDirectory: string): Promise<RecognizedText[]>;
}

export class Textractor implements ITextractor {
  private getLogger: () => Logger | IConsoleLogger;

  constructor(getLogger: () => Logger | IConsoleLogger) {
    this.getLogger = getLogger;
  }

  async extract(image: string, ocrLib: OCRLib, rootDirectory: string): Promise<RecognizedText[]> {
    return new Promise(async (resolve, reject) => {
      if (ocrLib === OCRLib.WINDOWS) {
        this.getLogger().error('Windows is not supported yet');
        reject(new Error('Windows is not supported yet'));
      } else if (ocrLib === OCRLib.VISIONKIT) {
        let binaryLocation = '';
        if (config.builtFor === 'dev') {
          binaryLocation = path.join(rootDirectory, 'bin', 'dev', 'Textractor');
        } else {
          binaryLocation = path.join(rootDirectory, 'bin', 'Textractor');
        }
        const child = spawn(binaryLocation, [image]);
        let recognizedTexts: RecognizedText[] = [];
        child.stdout.on('data', (data: any) => {
          console.log(`stdout: ${data.toString('utf8')}`);
          resolve(data.toString('utf8'));
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
        child.stderr.on('data', (data: any) => {
          console.log(`stderr: ${data}`);
        });
        child.on('error', (error: any) => {
          console.log(`error: ${error.message}`);
          reject(new Error(`Error extracting text from image: ${error.message}`));
        });
        child.on('close', (code: any) => {
          console.log(`child process exited with code ${code}`);
        });
      } else {
        reject(new Error('Invalid OCR library'));
      }
    });
  }
}
