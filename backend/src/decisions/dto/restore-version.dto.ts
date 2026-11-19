import { IsOptional, IsString } from 'class-validator';

export class RestoreVersionDto {
    @IsOptional()
    @IsString()
    commitMessage?: string;
}