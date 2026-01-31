import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeType, DisputeStatus, DisputeEvidence, DisputeResolution } from '../entities/dispute.entity';

export class CreateDisputeDto {
  @ApiProperty({ description: 'Split ID being disputed' })
  @IsUUID()
  @IsNotEmpty()
  splitId: string;

  @ApiProperty({ description: 'Wallet address of the person raising the dispute' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  raisedBy: string;

  @ApiProperty({ enum: DisputeType, description: 'Type of dispute' })
  @IsEnum(DisputeType)
  @IsNotEmpty()
  disputeType: DisputeType;

  @ApiProperty({ description: 'Detailed description of the dispute' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({ description: 'Evidence supporting the dispute', type: 'object' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DisputeEvidenceDto)
  evidence?: DisputeEvidenceDto;
}

export class DisputeEvidenceDto implements DisputeEvidence {
  @ApiPropertyOptional({ description: 'URLs to uploaded images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'URLs to receipt images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  receipts?: string[];

  @ApiPropertyOptional({ description: 'Additional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDisputeStatusDto {
  @ApiProperty({ enum: DisputeStatus, description: 'New status' })
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  status: DisputeStatus;

  @ApiPropertyOptional({ description: 'Admin/resolver wallet address' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  resolvedBy?: string;
}

export class AddEvidenceDto {
  @ApiPropertyOptional({ description: 'Image URLs to add', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Receipt URLs to add', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  receipts?: string[];

  @ApiPropertyOptional({ description: 'Additional description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class AdjustmentDto {
  @ApiProperty({ description: 'Participant wallet address' })
  @IsString()
  @IsNotEmpty()
  participantId: string;

  @ApiProperty({ description: 'Original amount' })
  @IsNumber()
  @Min(0)
  originalAmount: number;

  @ApiProperty({ description: 'New adjusted amount' })
  @IsNumber()
  @Min(0)
  newAmount: number;
}

export class CompensationDto {
  @ApiProperty({ description: 'Participant wallet address to compensate' })
  @IsString()
  @IsNotEmpty()
  participantId: string;

  @ApiProperty({ description: 'Compensation amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Reason for compensation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ description: 'Resolution decision' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  decision: string;

  @ApiProperty({ description: 'Reasoning behind the resolution' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  reasoning: string;

  @ApiPropertyOptional({ description: 'Amount adjustments', type: [AdjustmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentDto)
  adjustments?: AdjustmentDto[];

  @ApiPropertyOptional({ description: 'Compensations to be paid', type: [CompensationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompensationDto)
  compensations?: CompensationDto[];

  @ApiProperty({ description: 'Resolver wallet address' })
  @IsString()
  @IsNotEmpty()
  resolvedBy: string;
}

export class AppealDisputeDto {
  @ApiProperty({ description: 'Reason for appeal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  appealReason: string;

  @ApiProperty({ description: 'Wallet address of person appealing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  appealedBy: string;

  @ApiPropertyOptional({ description: 'Additional evidence for appeal', type: DisputeEvidenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DisputeEvidenceDto)
  additionalEvidence?: DisputeEvidenceDto;
}

export class DisputeQueryDto {
  @ApiPropertyOptional({ description: 'Filter by split ID' })
  @IsOptional()
  @IsUUID()
  splitId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ description: 'Filter by raised by wallet address' })
  @IsOptional()
  @IsString()
  raisedBy?: string;

  @ApiPropertyOptional({ description: 'Filter by dispute type', enum: DisputeType })
  @IsOptional()
  @IsEnum(DisputeType)
  disputeType?: DisputeType;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}