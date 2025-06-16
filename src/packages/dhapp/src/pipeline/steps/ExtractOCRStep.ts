import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';
import { Textractor, OCRLib } from '@trici/textract';
import path from 'path';
import fs from 'fs';

export class ExtractOCRStep extends BasePipelineStep {
  constructor(getLogger: () => Logger | IConsoleLogger) {
    super(getLogger, 3, 5000); // 3 retries, 5 second delay
  }

  getStepName(): string {
    return 'extract_ocr';
  }

  async execute(job: IDhappJob): Promise<IPipelineStepResult> {
    this.getLogger().info('Extracting OCR from frames');
    return this.retryWithBackoff(
      async () => {
        const textractor = new Textractor(this.getLogger);

        const sessionName = job.job_name.split('_')[0];
        const chunkNumber = job.job_name.split('_')[1];
        const uniqueFramesJsonFilePath = path.join(
          job.job_session_directory,
          'processed',
          `${sessionName}-unique-frames-chunk-${chunkNumber}.json`,
        );

        if (!fs.existsSync(uniqueFramesJsonFilePath)) {
          throw new Error(`Unique frames JSON file not found at: ${uniqueFramesJsonFilePath}`);
        }

        const uniqueFrames = JSON.parse(fs.readFileSync(uniqueFramesJsonFilePath, 'utf8'));

        if (!Array.isArray(uniqueFrames) || uniqueFrames.length === 0) {
          throw new Error('No frames found in the unique frames JSON file');
        }

        const ocrSavedResultFiles = [];
        for (const frame of uniqueFrames) {
          if (!frame.framePath || !fs.existsSync(frame.framePath)) {
            throw new Error(`Frame path is invalid or file does not exist: ${frame.framePath}`);
          }

          const projectRoot = path.join(__dirname, '..');

          const result = await textractor.extract(frame.framePath, OCRLib.VISIONKIT, projectRoot);

          if (!result) {
            throw new Error(`OCR extraction failed for frame: ${frame.framePath}`);
          }

          // Write the result to a file
          const ocrTermsWithCoordinates = frame.framePath.replace('.jpg', '.geo.json');
          const ocrTerms = frame.framePath.replace('.jpg', '.txt');
          const ocrResult = {
            termsFilePath: ocrTerms,
            geoTermsFilePath: ocrTermsWithCoordinates,
          };
          ocrSavedResultFiles.push(ocrResult);
        }

        return {
          success: true,
          data: {
            ocr: ocrSavedResultFiles,
          },
        };
      },
      job,
      'OCR extraction',
    );
  }
}
