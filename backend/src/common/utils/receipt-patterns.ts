/**
 * Regex patterns for extracting receipt information
 */
export class ReceiptPatterns {
  // Pattern for prices: $12.99, 12.99, $12, etc.
  static PRICE_PATTERN =
    /\$?\s*(\d+[.,]\d{2}|\d+)\b(?!\d)/g;

  // Pattern for quantities: "2x", "qty: 2", "2 x"
  static QUANTITY_PATTERN =
    /(?:qty|quantity|x|×)[\s:]*(\d+)/gi;

  // Pattern for totals (case insensitive)
  static TOTAL_PATTERN = /(?:total|amount due|grand total)[:\s]*\$?\s*([\d.,]+)/i;

  // Pattern for subtotal
  static SUBTOTAL_PATTERN =
    /(?:subtotal|sub[\s-]?total)[:\s]*\$?\s*([\d.,]+)/i;

  // Pattern for tax
  static TAX_PATTERN =
    /(?:tax|sales tax|tax amount|vat)[:\s]*\$?\s*([\d.,]+)/i;

  // Pattern for tip
  static TIP_PATTERN =
    /(?:tip|gratuity|additional)[:\s]*\$?\s*([\d.,]+)/i;

  // Pattern for common item names
  static COMMON_ITEMS =
    /(?:coffee|drink|food|meal|sandwich|burger|pizza|salad|water|tea|juice|soda|beer|wine|dessert|item)/i;

  /**
   * Extract all prices from text
   */
  static extractPrices(text: string): number[] {
    const matches = text.matchAll(this.PRICE_PATTERN);
    const prices: number[] = [];

    for (const match of matches) {
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        prices.push(price);
      }
    }

    return prices;
  }

  /**
   * Extract quantity from line of text
   */
  static extractQuantity(line: string): number {
    const match = line.match(this.QUANTITY_PATTERN);
    if (match) {
      const qty = parseInt(match[1], 10);
      return isNaN(qty) ? 1 : qty;
    }
    return 1;
  }

  /**
   * Extract total amount
   */
  static extractTotal(text: string): number | null {
    const match = text.match(this.TOTAL_PATTERN);
    if (match) {
      const totalStr = match[1].replace(/[^\d.]/g, '');
      const total = parseFloat(totalStr);
      return isNaN(total) ? null : total;
    }
    return null;
  }

  /**
   * Extract subtotal
   */
  static extractSubtotal(text: string): number | null {
    const match = text.match(this.SUBTOTAL_PATTERN);
    if (match) {
      const subtotalStr = match[1].replace(/[^\d.]/g, '');
      const subtotal = parseFloat(subtotalStr);
      return isNaN(subtotal) ? null : subtotal;
    }
    return null;
  }

  /**
   * Extract tax amount
   */
  static extractTax(text: string): number | null {
    const match = text.match(this.TAX_PATTERN);
    if (match) {
      const taxStr = match[1].replace(/[^\d.]/g, '');
      const tax = parseFloat(taxStr);
      return isNaN(tax) ? null : tax;
    }
    return null;
  }

  /**
   * Extract tip amount
   */
  static extractTip(text: string): number | null {
    const match = text.match(this.TIP_PATTERN);
    if (match) {
      const tipStr = match[1].replace(/[^\d.]/g, '');
      const tip = parseFloat(tipStr);
      return isNaN(tip) ? null : tip;
    }
    return null;
  }

  /**
   * Normalize number string to float
   */
  static normalizePrice(priceStr: string): number {
    const normalized = priceStr.replace(/[^\d.]/g, '');
    return parseFloat(normalized);
  }
}
