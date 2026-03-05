import { IsDateString, IsOptional } from 'class-validator';

export class MoodQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
