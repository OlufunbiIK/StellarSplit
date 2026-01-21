import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OcrService } from '../ocr/ocr.service';
import { ReceiptParser } from '../ocr/parsers/receipt-parser';
import { ScanReceiptResponseDto } from './receipts.dto';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimes.join(', ')}`,
      ) as any,
      false,
    );
  }
};

@ApiTags('Receipts')
@Controller('receipts')
export class ReceiptsController {
  private readonly logger = new Logger(ReceiptsController.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly receiptParser: ReceiptParser,
  ) {}

  @Post('scan')
  @UseInterceptors(
    FileInterceptor('image', {
      storage,
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Scan a receipt image and extract items and prices',
    description: 'Upload a receipt image to extract items, prices, and totals using OCR',
  })
  @ApiResponse({
    status: 200,
    description: 'Receipt successfully scanned and parsed',
    type: ScanReceiptResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or missing image',
  })
  @ApiResponse({
    status: 500,
    description: 'OCR processing failed',
  })
  async scanReceipt(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ScanReceiptResponseDto> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const filePath = file.path;

    try {
      this.logger.log(`Processing receipt image: ${file.originalname}`);

      // Extract text using OCR
      const ocrResult = await this.ocrService.extractTextWithRetry(
        filePath,
        3,
      );

      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        throw new BadRequestException(
          'No text could be extracted from the receipt image',
        );
      }

      this.logger.log(
        `OCR extraction successful, confidence: ${ocrResult.confidence}%`,
      );

      // Parse the extracted text
      const parsedReceipt = this.receiptParser.parse(
        ocrResult.text,
        ocrResult.confidence,
      );

      // Validate receipt
      if (!this.receiptParser.validate(parsedReceipt)) {
        this.logger.warn('Receipt validation failed, attempting recovery...');
        // Still return partial results
      }

      // Merge duplicate items
      parsedReceipt.items = this.receiptParser.mergeDuplicateItems(
        parsedReceipt.items,
      );

      // If no total found, calculate from items
      if (!parsedReceipt.total && parsedReceipt.items.length > 0) {
        const totals = this.receiptParser.calculateTotals(
          parsedReceipt.items,
        );
        parsedReceipt.subtotal = parsedReceipt.subtotal || totals.subtotal;
        parsedReceipt.tax = parsedReceipt.tax || totals.tax;
        parsedReceipt.total = parsedReceipt.total || totals.total;
      }

      this.logger.log(
        `Receipt parsed: ${parsedReceipt.items.length} items, total: $${parsedReceipt.total}`,
      );

      const response: ScanReceiptResponseDto = {
        items: parsedReceipt.items,
        subtotal: parsedReceipt.subtotal,
        tax: parsedReceipt.tax,
        tip: parsedReceipt.tip,
        total: parsedReceipt.total,
        confidence: parsedReceipt.confidence,
        rawText: parsedReceipt.rawText,
      };

      return response;
    } catch (error) {
      this.logger.error(
        `Receipt scanning failed: ${(error as Error).message}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to process receipt: ${(error as Error).message}`,
      );
    } finally {
      // Clean up uploaded file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.debug(`Cleaned up temporary file: ${filePath}`);
        }
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to clean up file ${filePath}:`,
          cleanupError,
        );
      }
    }
  }
}
