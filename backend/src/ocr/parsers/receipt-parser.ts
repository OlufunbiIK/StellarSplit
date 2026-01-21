import { Injectable, Logger } from '@nestjs/common';
import { ReceiptPatterns } from '../../common/utils/receipt-patterns';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  confidence?: number;
}

export interface ParsedReceipt {
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
  confidence: number;
  rawText: string;
  lineItems: string[];
}

@Injectable()
export class ReceiptParser {
  private readonly logger = new Logger(ReceiptParser.name);

  /**
   * Parse OCR text to extract receipt data
   */
  parse(
    ocrText: string,
    ocrConfidence: number = 80,
  ): ParsedReceipt {
    try {
      this.logger.log('Parsing receipt text...');

      const lines = ocrText.split('\n').map((line) => line.trim());
      const items: ReceiptItem[] = [];
      const lineItems: string[] = [];

      // Extract totals first
      const total = ReceiptPatterns.extractTotal(ocrText);
      const subtotal = ReceiptPatterns.extractSubtotal(ocrText);
      const tax = ReceiptPatterns.extractTax(ocrText);
      const tip = ReceiptPatterns.extractTip(ocrText);

      // Parse line items
      for (const line of lines) {
        if (this.isReceiptLine(line)) {
          lineItems.push(line);
          const item = this.parseLineItem(line);
          if (item) {
            items.push(item);
          }
        }
      }

      // If no items found using line-by-line parsing, try price extraction
      if (items.length === 0) {
        items.push(...this.extractItemsFromPrices(lines, ocrText));
      }

      const result: ParsedReceipt = {
        items,
        subtotal,
        tax,
        tip,
        total,
        confidence: ocrConfidence,
        rawText: ocrText,
        lineItems,
      };

      this.logger.log(
        `Receipt parsed: ${items.length} items, total: $${total}`,
      );

      return result;
    } catch (error) {
      this.logger.error('Receipt parsing error:', error);
      throw error;
    }
  }

  /**
   * Check if a line is a receipt line item (contains price)
   */
  private isReceiptLine(line: string): boolean {
    // Must contain a price
    const hasPricePattern = /\$?\s*\d+[.,]\d{2}/i.test(line);

    // Must not be a header/footer line
    const isHeaderFooter =
      /^(total|subtotal|tax|tip|amount|thank|welcome|store)/i.test(
        line,
      ) || line.length < 5;

    return hasPricePattern && !isHeaderFooter;
  }

  /**
   * Parse individual line item
   */
  private parseLineItem(line: string): ReceiptItem | null {
    try {
      // Remove leading/trailing whitespace
      line = line.trim();

      // Extract price from end of line
      const priceMatch = line.match(
        /\$?\s*([\d.,]+)\s*$/,
      );
      if (!priceMatch) {
        return null;
      }

      const priceStr = priceMatch[1].replace(',', '.');
      const price = parseFloat(priceStr);

      if (isNaN(price) || price <= 0) {
        return null;
      }

      // Extract quantity
      const quantity = ReceiptPatterns.extractQuantity(line);

      // Extract item name (everything before the price)
      let name = line
        .substring(0, line.lastIndexOf(priceMatch[0]))
        .trim();

      // Remove quantity indicators from name
      name = name
        .replace(/^\d+\s*x\s*/i, '')
        .replace(/qty\s*:?\s*\d+/i, '')
        .replace(/(\d+\s*×|\d+\s*x)\s*/i, '')
        .trim();

      // Clean up the name
      name = this.cleanItemName(name);

      if (!name || name.length < 2) {
        return null;
      }

      return {
        name,
        quantity,
        price,
        confidence: 70, // Default confidence for parsed items
      };
    } catch (error) {
      this.logger.debug(`Failed to parse line "${line}":`, error);
      return null;
    }
  }

  /**
   * Extract items from detected prices when line parsing fails
   */
  private extractItemsFromPrices(
    lines: string[],
    ocrText: string,
  ): ReceiptItem[] {
    const prices = ReceiptPatterns.extractPrices(ocrText);
    const items: ReceiptItem[] = [];

    // Try to match prices with item names
    for (let i = 0; i < lines.length && items.length < prices.length; i++) {
      const line = lines[i];

      // Check if line contains a price
      const priceMatch = line.match(/\$?\s*([\d.,]+)\s*$/);
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(',', '.');
        const price = parseFloat(priceStr);

        if (!isNaN(price) && price > 0) {
          const name = line
            .substring(0, line.lastIndexOf(priceMatch[0]))
            .trim();

          if (name && name.length >= 2) {
            items.push({
              name: this.cleanItemName(name),
              quantity: 1,
              price,
              confidence: 60,
            });
          }
        }
      }
    }

    return items;
  }

  /**
   * Clean and normalize item name
   */
  private cleanItemName(name: string): string {
    return name
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Calculate receipt totals from items
   */
  calculateTotals(items: ReceiptItem[], taxRate: number = 0.08) {
    const itemsSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const calculatedTax = itemsSubtotal * taxRate;
    const calculatedTotal = itemsSubtotal + calculatedTax;

    return {
      subtotal: itemsSubtotal,
      tax: calculatedTax,
      total: calculatedTotal,
    };
  }

  /**
   * Validate parsed receipt data
   */
  validate(receipt: ParsedReceipt): boolean {
    // Must have at least one item
    if (!receipt.items || receipt.items.length === 0) {
      this.logger.warn('Receipt has no items');
      return false;
    }

    // Must have a total
    if (!receipt.total || receipt.total <= 0) {
      this.logger.warn('Receipt has invalid total');
      return false;
    }

    // All items must have positive price
    if (!receipt.items.every((item) => item.price > 0)) {
      this.logger.warn('Receipt has items with invalid prices');
      return false;
    }

    return true;
  }

  /**
   * Merge duplicate or similar items
   */
  mergeDuplicateItems(items: ReceiptItem[]): ReceiptItem[] {
    const merged: Map<string, ReceiptItem> = new Map();

    for (const item of items) {
      const normalizedName = item.name.toLowerCase().trim();
      const existing = merged.get(normalizedName);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.set(normalizedName, { ...item });
      }
    }

    return Array.from(merged.values());
  }
}
