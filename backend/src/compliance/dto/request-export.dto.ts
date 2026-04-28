import { IsEnum, IsDateString, IsOptional, IsObject, ValidateNested, IsString, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ExportFormat } from '../entities/tax-export-request.entity';

class ExportFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];
}

export class RequestExportDto {
  @IsEnum(ExportFormat)
  exportFormat!: ExportFormat;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;
}
