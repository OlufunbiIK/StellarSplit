import { IsString, IsOptional, IsArray } from "class-validator";

export class CreateSplitFromTemplateDto {
    @IsString()
    templateId!: string;

    @IsOptional()
    @IsArray()
    participantOverrides?: any[];

    @IsOptional()
    @IsArray()
    itemOverrides?: any[];

    @IsOptional()
    @IsString()
    customName?: string;
}
