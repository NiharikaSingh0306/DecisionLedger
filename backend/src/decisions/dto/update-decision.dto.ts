
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsEnum,
} from 'class-validator';

import { DecisionStatus } from '@prisma/client';

export class UpdateDecisionDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    context?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    decisionSummary?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    rationale?: string;

    @IsOptional()
    @IsEnum(DecisionStatus)
    status?: DecisionStatus;

    @IsOptional()
    @IsString()
    owner?: string;
}
