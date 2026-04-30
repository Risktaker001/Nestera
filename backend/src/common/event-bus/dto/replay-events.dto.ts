import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ReplayEventsDto {
  @ApiProperty({
    description: 'IDs of failed events to replay',
    type: [String],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids: string[];
}
