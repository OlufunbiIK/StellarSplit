import sharp from 'sharp';
import * as path from 'path';

export interface ImagePreprocessingOptions {
  rotate?: boolean;
  enhance?: boolean;
  crop?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export class ImagePreprocessor {
  /**
   * Preprocess an image for OCR
   */
  static async preprocess(
    imagePath: string,
    options: ImagePreprocessingOptions = {},
  ): Promise<Buffer> {
    const {
      rotate = true,
      enhance = true,
      crop = false,
      maxWidth = 2000,
      maxHeight = 2000,
    } = options;

    let pipeline = sharp(imagePath);

    // Auto-rotate based on EXIF data
    if (rotate) {
      pipeline = pipeline.rotate();
    }

    // Enhance image for better OCR results
    if (enhance) {
      pipeline = pipeline.normalize().sharpen();
    }

    // Resize if needed
    if (maxWidth || maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to grayscale for better OCR
    pipeline = pipeline.grayscale().normalize();

    return pipeline.toBuffer();
  }

  /**
   * Convert image to base64
   */
  static async toBase64(imagePath: string): Promise<string> {
    const buffer = await ImagePreprocessor.preprocess(imagePath, {
      rotate: true,
      enhance: true,
    });
    return buffer.toString('base64');
  }

  /**
   * Get image metadata
   */
  static async getMetadata(imagePath: string) {
    return sharp(imagePath).metadata();
  }

  /**
   * Extract text-heavy regions (crop to receipt area)
   */
  static async cropReceipt(imagePath: string): Promise<Buffer> {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to get image dimensions');
    }

    // Assume receipt is in the center 90% of the image
    const padding = 0.05;
    const left = Math.floor(metadata.width * padding);
    const top = Math.floor(metadata.height * padding);
    const width = Math.floor(metadata.width * (1 - 2 * padding));
    const height = Math.floor(metadata.height * (1 - 2 * padding));

    return image.extract({ left, top, width, height }).toBuffer();
  }
}
