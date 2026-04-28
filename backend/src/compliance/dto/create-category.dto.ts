import { IsString, IsNotEmpty, IsBoolean, IsOptional, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(7, 7)
  color!: string;

  @IsBoolean()
  @IsOptional()
  taxDeductible?: boolean;
}
