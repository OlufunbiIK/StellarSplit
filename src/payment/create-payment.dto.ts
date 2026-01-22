import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Length,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StellarAsset } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Split ID this payment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  splitId: string;

  @ApiProperty({
    description: 'Participant ID making the payment',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  participantId: string;

  @ApiProperty({
    description: 'Stellar sender address',
    example: 'GDJXQYEWDPGYK4LGCLFEV6HBIW3M22IK6NN2WQONHP3ELH6HINIKBVY7',
  })
  @IsString()
  @IsNotEmpty()
  @Length(56, 56)
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'fromAddress must be a valid Stellar public key',
  })
  fromAddress: string;

  @ApiProperty({
    description: 'Stellar recipient address',
    example: 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5',
  })
  @IsString()
  @IsNotEmpty()
  @Length(56, 56)
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'toAddress must be a valid Stellar public key',
  })
  toAddress: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 100.5,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.0000001)
  amount: number;

  @ApiProperty({
    description: 'Stellar asset type',
    enum: StellarAsset,
    example: StellarAsset.XLM,
  })
  @IsEnum(StellarAsset)
  @IsNotEmpty()
  asset: StellarAsset;

  @ApiProperty({
    description: 'Stellar transaction hash',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
  })
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'stellarTxHash must be a valid 64-character hex string',
  })
  stellarTxHash: string;

  @ApiPropertyOptional({
    description: 'Optional memo for the transaction',
    example: 'Payment for dinner split',
  })
  @IsString()
  @IsOptional()
  @Length(1, 28)
  memo?: string;
}