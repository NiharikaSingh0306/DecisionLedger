import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DecisionStatus, DecisionVisibility } from '@prisma/client';

export class FindDecisionsDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(DecisionStatus)
    status?: DecisionStatus;

    @IsOptional()
    @IsString()
    owner?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @IsOptional()
    @IsEnum(DecisionVisibility)
    visibility?: DecisionVisibility;
}