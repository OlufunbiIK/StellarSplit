import { ApiProperty } from '@nestjs/swagger';

export class ReceiptItemDto {
  @ApiProperty({ description: 'Item name' })
  name!: string;

  @ApiProperty({ description: 'Item quantity', example: 1 })
  quantity!: number;

  @ApiProperty({ description: 'Item price in dollars', example: 12.99 })
  price!: number;

  @ApiProperty({
    description: 'OCR confidence score (0-100)',
    example: 85,
    required: false,
  })
  confidence?: number;
}

export class ScanReceiptResponseDto {
  @ApiProperty({
    description: 'Extracted items from receipt',
    type: [ReceiptItemDto],
  })
  items!: ReceiptItemDto[];

  @ApiProperty({
    description: 'Subtotal amount in dollars',
    example: 45.0,
    nullable: true,
  })
  subtotal!: number | null;

  @ApiProperty({
    description: 'Tax amount in dollars',
    example: 3.6,
    nullable: true,
  })
  tax!: number | null;

  @ApiProperty({
    description: 'Tip amount in dollars',
    example: 5.0,
    nullable: true,
  })
  tip!: number | null;

  @ApiProperty({
    description: 'Total amount in dollars',
    example: 53.6,
  })
  total!: number | null;

  @ApiProperty({
    description: 'Overall OCR confidence score (0-100)',
    example: 82,
  })
  confidence!: number;

  @ApiProperty({
    description: 'Raw extracted text from receipt',
    example: 'Store Receipt...',
  })
  rawText?: string;
}
