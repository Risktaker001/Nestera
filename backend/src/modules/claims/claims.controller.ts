import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { MedicalClaim } from './entities/medical-claim.entity';

@ApiTags('claims')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a new medical claim',
    description: 'Create a new medical claim with patient information, diagnoses, and treatments.',
  })
  @ApiBody({ type: CreateClaimDto })
  @ApiResponse({
    status: 201,
    description: 'Claim successfully submitted',
    type: MedicalClaim,
  })
  @ApiResponse({ status: 400, description: 'Invalid claim data' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async submitClaim(
    @Body() createClaimDto: CreateClaimDto,
  ): Promise<MedicalClaim> {
    return await this.claimsService.createClaim(createClaimDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all claims' })
  @ApiResponse({
    status: 200,
    description: 'List of all claims',
    type: [MedicalClaim],
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getAllClaims(): Promise<MedicalClaim[]> {
    return await this.claimsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific claim by ID' })
  @ApiParam({
    name: 'id',
    description: 'Claim UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Claim details',
    type: MedicalClaim,
  })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getClaim(@Param('id') id: string): Promise<MedicalClaim | null> {
    return await this.claimsService.findOne(id);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify claim with hospital' })
  @ApiParam({
    name: 'id',
    description: 'Claim UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Claim verified with hospital',
    type: MedicalClaim,
  })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({
    status: 503,
    description: 'Hospital service unavailable',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async verifyClaimWithHospital(
    @Param('id') id: string,
  ): Promise<MedicalClaim> {
    return await this.claimsService.verifyClaimWithHospital(id);
  }

  @Get(':id/hospital-data')
  @ApiOperation({ summary: 'Fetch claim data from hospital' })
  @ApiParam({
    name: 'id',
    description: 'Claim UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Hospital claim data retrieved' })
  @ApiResponse({
    status: 404,
    description: 'Claim not found or hospital endpoint not configured',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async fetchHospitalClaimData(@Param('id') id: string) {
    const claim = await this.claimsService.findOne(id);
    if (!claim) {
      throw new Error('Claim not found');
    }
    return await this.claimsService.fetchHospitalClaimData(
      claim.hospitalId,
      id,
    );
  }
}
