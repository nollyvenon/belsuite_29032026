import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RevenueQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber() days?: number;
}
