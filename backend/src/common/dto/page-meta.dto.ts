import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from './page-options.dto';

export interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  totalItemCount: number;
}

export class PageMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  readonly page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  readonly limit: number;

  @ApiProperty({
    description: 'Total number of items across all pages',
    example: 150,
  })
  readonly totalItemCount: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 15,
  })
  readonly pageCount: number;

  @ApiProperty({
    description: 'Whether there is a previous page available',
    example: false,
  })
  readonly hasPreviousPage: boolean;

  @ApiProperty({
    description: 'Whether there is a next page available',
    example: true,
  })
  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto, totalItemCount }: PageMetaDtoParameters) {
    this.page = pageOptionsDto.page ?? 1;
    this.limit = pageOptionsDto.limit ?? 10;
    this.totalItemCount = totalItemCount;
    this.pageCount = Math.ceil(totalItemCount / this.limit);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}
