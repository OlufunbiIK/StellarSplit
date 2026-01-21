import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptsController } from './receipts.controller';
import { OcrService } from '../ocr/ocr.service';
import { ReceiptParser } from '../ocr/parsers/receipt-parser';

describe('ReceiptsController', () => {
  let controller: ReceiptsController;
  let ocrService: OcrService;
  let receiptParser: ReceiptParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceiptsController],
      providers: [
        {
          provide: OcrService,
          useValue: {
            extractTextWithRetry: jest.fn(),
          },
        },
        {
          provide: ReceiptParser,
          useValue: {
            parse: jest.fn(),
            validate: jest.fn(),
            mergeDuplicateItems: jest.fn((items) => items),
            calculateTotals: jest.fn(() => ({
              subtotal: 10,
              tax: 1,
              total: 11,
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<ReceiptsController>(ReceiptsController);
    ocrService = module.get<OcrService>(OcrService);
    receiptParser = module.get<ReceiptParser>(ReceiptParser);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('scanReceipt', () => {
    it('should throw error when no file is provided', async () => {
      const result = controller.scanReceipt(undefined as any);
      await expect(result).rejects.toThrow('No image file provided');
    });
  });
});
