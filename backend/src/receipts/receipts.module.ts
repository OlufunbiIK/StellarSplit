import { Module } from '@nestjs/common';
import { OcrModule } from '../ocr/ocr.module';
import { ReceiptsController } from './receipts.controller';
import { ReceiptParser } from '../ocr/parsers/receipt-parser';

@Module({
  imports: [OcrModule],
  controllers: [ReceiptsController],
  providers: [ReceiptParser],
})
export class ReceiptsModule {}
