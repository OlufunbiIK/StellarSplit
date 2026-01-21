import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptParser, ParsedReceipt } from './receipt-parser';

describe('ReceiptParser', () => {
  let parser: ReceiptParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceiptParser],
    }).compile();

    parser = module.get<ReceiptParser>(ReceiptParser);
  });

  it('should be defined', () => {
    expect(parser).toBeDefined();
  });

  describe('parse', () => {
    it('should parse simple receipt text', () => {
      const ocrText = `COFFEE SHOP
Espresso $3.50
Croissant $4.25
Subtotal $7.75
Tax $0.62
Total $8.37`;

      const result = parser.parse(ocrText, 85);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeDefined();
      expect(result.confidence).toBe(85);
    });

    it('should extract multiple items with quantities', () => {
      const ocrText = `2x Cappuccino $7.00
1x Sandwich $8.50
Total $15.50`;

      const result = parser.parse(ocrText, 90);

      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should handle receipts without structured totals', () => {
      const ocrText = `Coffee 3.50
Muffin 2.75
Water 1.00`;

      const result = parser.parse(ocrText, 75);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every(i => i.price > 0)).toBe(true);
    });

    it('should extract tax separately', () => {
      const ocrText = `Item 1 $10.00
Item 2 $5.00
Subtotal $15.00
Tax $1.50
Total $16.50`;

      const result = parser.parse(ocrText, 88);

      expect(result.subtotal).toBe(15.0);
      expect(result.tax).toBe(1.5);
      expect(result.total).toBeDefined();
    });

    it('should extract tip amount', () => {
      const ocrText = `Meal $25.00
Tax $2.50
Tip $5.00
Total $32.50`;

      const result = parser.parse(ocrText, 85);

      expect(result.tip).toBe(5.0);
    });
  });

  describe('validate', () => {
    it('should validate correct receipt', () => {
      const receipt: ParsedReceipt = {
        items: [{ name: 'Coffee', quantity: 1, price: 3.5 }],
        subtotal: 3.5,
        tax: 0.28,
        tip: 0,
        total: 3.78,
        confidence: 85,
        rawText: 'test',
        lineItems: ['Coffee $3.50'],
      };

      expect(parser.validate(receipt)).toBe(true);
    });

    it('should reject receipt with no items', () => {
      const receipt: ParsedReceipt = {
        items: [],
        subtotal: 0,
        tax: 0,
        tip: 0,
        total: 0,
        confidence: 85,
        rawText: 'test',
        lineItems: [],
      };

      expect(parser.validate(receipt)).toBe(false);
    });

    it('should reject receipt with no total', () => {
      const receipt: ParsedReceipt = {
        items: [{ name: 'Coffee', quantity: 1, price: 3.5 }],
        subtotal: 3.5,
        tax: 0,
        tip: 0,
        total: null,
        confidence: 85,
        rawText: 'test',
        lineItems: ['Coffee $3.50'],
      };

      expect(parser.validate(receipt)).toBe(false);
    });
  });

  describe('mergeDuplicateItems', () => {
    it('should merge identical items', () => {
      const items = [
        { name: 'Coffee', quantity: 1, price: 3.5 },
        { name: 'Coffee', quantity: 2, price: 3.5 },
      ];

      const merged = parser.mergeDuplicateItems(items);

      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(3);
    });

    it('should be case-insensitive', () => {
      const items = [
        { name: 'COFFEE', quantity: 1, price: 3.5 },
        { name: 'coffee', quantity: 1, price: 3.5 },
      ];

      const merged = parser.mergeDuplicateItems(items);

      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(2);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate totals correctly', () => {
      const items = [
        { name: 'Item 1', quantity: 1, price: 10 },
        { name: 'Item 2', quantity: 2, price: 5 },
      ];

      const totals = parser.calculateTotals(items, 0.1);

      expect(totals.subtotal).toBe(20); // 10 + 10
      expect(totals.tax).toBe(2); // 20 * 0.1
      expect(totals.total).toBe(22); // 20 + 2
    });
  });
});
