
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsEnum,
} from 'class-validator';

import { DecisionStatus } from '@prisma/client';

export class CreateDecisionDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    context: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];

    @IsString()
    @IsNotEmpty()
    decisionSummary: string;

    @IsString()
    @IsNotEmpty()
    rationale: string;

    @IsOptional()
    @IsEnum(DecisionStatus)
    status?: DecisionStatus;

    @IsOptional()
    @IsString()
    owner?: string;

    @IsOptional()
    @IsString()
    commitMessage?: string;

}
