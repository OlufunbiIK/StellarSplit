import { PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentStatus } from '../entities/payment.entity';

export class UpdatePaymentDto extends PartialType(
  OmitType(CreatePaymentDto, ['splitId', 'participantId', 'stellarTxHash'] as const),
) {
  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.CONFIRMED,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Timestamp when payment was confirmed',
    example: '2024-01-22T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  confirmedAt?: Date;
}