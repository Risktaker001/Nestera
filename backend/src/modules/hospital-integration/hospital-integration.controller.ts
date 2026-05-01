import {
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  HospitalIntegrationService,
  CircuitBreakerState,
} from './hospital-integration.service';
import {
  HospitalClaimDataDto,
  HospitalVerificationDto,
} from './dto/hospital-data.dto';

@ApiTags('hospital-integration')
@Controller('hospital-integration')
export class HospitalIntegrationController {
  constructor(
    private readonly hospitalIntegrationService: HospitalIntegrationService,
  ) {}

  @Get(':hospitalId/claims/:claimId')
  @ApiOperation({
    summary: 'Fetch claim data from hospital',
    description: 'Retrieve claim information from an external hospital system using the hospital ID and claim ID.',
  })
  @ApiParam({
    name: 'hospitalId',
    description: 'Hospital identifier (e.g., hospital-1, hospital-2)',
    example: 'hospital-1',
  })
  @ApiParam({
    name: 'claimId',
    description: 'Unique claim identifier',
    example: 'CLM-2025-000456',
  })
  @ApiResponse({
    status: 200,
    description: 'Claim data retrieved successfully',
    type: HospitalClaimDataDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital endpoint not configured or claim not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @ApiResponse({
    status: 503,
    description: 'Hospital service unavailable or circuit breaker open',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async fetchClaimData(
    @Param('hospitalId') hospitalId: string,
    @Param('claimId') claimId: string,
  ): Promise<HospitalClaimDataDto> {
    return await this.hospitalIntegrationService.fetchClaimData(
      hospitalId,
      claimId,
    );
  }

  @Post(':hospitalId/claims/:claimId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify claim with hospital',
    description: 'Trigger verification of a claim directly with the hospital system.',
  })
  @ApiParam({
    name: 'hospitalId',
    description: 'Hospital identifier',
    example: 'hospital-1',
  })
  @ApiParam({
    name: 'claimId',
    description: 'Claim UUID to verify',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Claim verified successfully',
    type: HospitalVerificationDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital endpoint not configured or claim not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @ApiResponse({
    status: 503,
    description: 'Circuit breaker is open or hospital service unavailable',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async verifyClaimWithHospital(
    @Param('hospitalId') hospitalId: string,
    @Param('claimId') claimId: string,
  ): Promise<HospitalVerificationDto> {
    return await this.hospitalIntegrationService.verifyClaimWithHospital(
      hospitalId,
      claimId,
    );
  }

  @Get(':hospitalId/patients/:patientId/claims')
  @ApiOperation({
    summary: 'Fetch patient claim history from hospital',
    description: 'Retrieve all claims for a specific patient from the hospital system.',
  })
  @ApiParam({
    name: 'hospitalId',
    description: 'Hospital identifier',
    example: 'hospital-1',
  })
  @ApiParam({
    name: 'patientId',
    description: 'Patient identifier from hospital system',
    example: 'HOSP-2025-001234',
  })
  @ApiResponse({
    status: 200,
    description: 'Patient history retrieved successfully',
    type: [HospitalClaimDataDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital endpoint not configured or patient not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @ApiResponse({
    status: 503,
    description: 'Circuit breaker is open or hospital service unavailable',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async fetchPatientHistory(
    @Param('hospitalId') hospitalId: string,
    @Param('patientId') patientId: string,
  ): Promise<HospitalClaimDataDto[]> {
    return await this.hospitalIntegrationService.fetchPatientHistory(
      hospitalId,
      patientId,
    );
  }

  @Get(':hospitalId/circuit-breaker/status')
  @ApiOperation({
    summary: 'Get circuit breaker status for a hospital',
    description: 'Check the current state of the circuit breaker for the specified hospital integration.',
  })
  @ApiParam({
    name: 'hospitalId',
    description: 'Hospital identifier',
    example: 'hospital-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker status retrieved',
    schema: {
      type: 'object',
      properties: {
        failures: { type: 'number', example: 0, description: 'Number of consecutive failures' },
        lastFailureTime: { type: 'number', nullable: true, example: null, description: 'Timestamp of last failure (ms)' },
        state: { type: 'string', enum: ['CLOSED', 'OPEN', 'HALF_OPEN'], example: 'CLOSED', description: 'Current circuit breaker state' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital endpoint not configured',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  getCircuitBreakerStatus(
    @Param('hospitalId') hospitalId: string,
  ): CircuitBreakerState {
    return this.hospitalIntegrationService.getCircuitBreakerStatus(hospitalId);
  }

  @Post(':hospitalId/circuit-breaker/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset circuit breaker for a hospital',
    description: 'Manually reset the circuit breaker state for a hospital, allowing requests to be retried.',
  })
  @ApiParam({
    name: 'hospitalId',
    description: 'Hospital identifier',
    example: 'hospital-1',
  })
  @ApiResponse({
    status: 204,
    description: 'Circuit breaker reset successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital endpoint not configured',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  resetCircuitBreaker(@Param('hospitalId') hospitalId: string): void {
    this.hospitalIntegrationService.resetCircuitBreaker(hospitalId);
  }
}
