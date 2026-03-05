import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMoodDto {
  @IsInt()
  @Min(1)
  @Max(10)
  value!: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emotions?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;
}
