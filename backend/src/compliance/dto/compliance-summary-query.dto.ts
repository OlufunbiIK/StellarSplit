import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class ComplianceSummaryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1970)
  @Max(2100)
  year!: number;
}
