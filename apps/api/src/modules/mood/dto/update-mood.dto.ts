import { IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateMoodDto {
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  value?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emotions?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
