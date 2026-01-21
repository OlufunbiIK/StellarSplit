import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import { ImagePreprocessor } from '../common/utils/image-preprocessor';

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: any[];
  rawData: any;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private worker: Tesseract.Worker | null = null;

  /**
   * Initialize Tesseract worker (lazy loading)
   */
  async initializeWorker(): Promise<Tesseract.Worker> {
    if (this.worker) {
      return this.worker;
    }

    try {
      this.logger.log('Initializing Tesseract worker...');
      const worker = await Tesseract.createWorker('eng', 1, {
        corePath: path.join(
          __dirname,
          '../../node_modules/tesseract.js-core',
        ),
      });
      this.worker = worker;
      this.logger.log('Tesseract worker initialized successfully');
      return worker;
    } catch (error) {
      this.logger.error('Failed to initialize Tesseract worker:', error);
      throw error;
    }
  }

  /**
   * Terminate Tesseract worker
   */
  async terminateWorker(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        this.logger.log('Tesseract worker terminated');
      } catch (error) {
        this.logger.error('Error terminating worker:', error);
      }
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractText(imagePath: string): Promise<OCRResult> {
    const worker = await this.initializeWorker();

    try {
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      this.logger.log(`Processing image: ${imagePath}`);

      // Preprocess image for better OCR
      const preprocessedBuffer = await ImagePreprocessor.preprocess(
        imagePath,
        {
          rotate: true,
          enhance: true,
          maxWidth: 2000,
          maxHeight: 2000,
        },
      );

      // Perform OCR
      const result = await worker.recognize(preprocessedBuffer);

      // Calculate confidence score (0-100)
      const confidence = Math.round(
        (result.data.confidence as number) || 0,
      );

      this.logger.log(
        `OCR completed with confidence: ${confidence}% for ${imagePath}`,
      );

      return {
        text: result.data.text as string,
        confidence,
        blocks: result.data.blocks as any[],
        rawData: result.data,
      };
    } catch (error) {
      this.logger.error('OCR extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from buffer (for uploaded files)
   */
  async extractTextFromBuffer(buffer: Buffer): Promise<OCRResult> {
    const worker = await this.initializeWorker();

    try {
      this.logger.log('Processing image buffer...');

      // Perform OCR directly on buffer
      const result = await worker.recognize(buffer);

      const confidence = Math.round(
        (result.data.confidence as number) || 0,
      );

      this.logger.log(`OCR completed with confidence: ${confidence}%`);

      return {
        text: result.data.text as string,
        confidence,
        blocks: result.data.blocks as any[],
        rawData: result.data,
      };
    } catch (error) {
      this.logger.error('OCR extraction from buffer failed:', error);
      throw error;
    }
  }

  /**
   * Extract text with retry logic
   */
  async extractTextWithRetry(
    imagePath: string,
    maxRetries: number = 3,
  ): Promise<OCRResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Attempt ${attempt}/${maxRetries} to extract text from ${imagePath}`,
        );
        return await this.extractText(imagePath);
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt} failed:`,
          (error as Error).message,
        );

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error('Failed to extract text after all retries');
  }

  /**
   * Process multiple images
   */
  async processMultipleImages(
    imagePaths: string[],
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (const imagePath of imagePaths) {
      try {
        const result = await this.extractText(imagePath);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to process image ${imagePath}:`,
          (error as Error).message,
        );
        // Continue processing other images
      }
    }

    return results;
  }
}
