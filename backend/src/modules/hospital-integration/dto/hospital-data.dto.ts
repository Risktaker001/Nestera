import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HospitalPatientDto {
  @ApiProperty({
    description: 'Unique patient identifier from hospital system',
    example: 'HOSP-2025-001234',
  })
  patientId: string;

  @ApiProperty({
    description: 'Patient full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Patient date of birth in ISO format',
    example: '1985-03-15',
  })
  dateOfBirth: string;

  @ApiPropertyOptional({
    description: 'Patient contact phone number',
    example: '+1-555-0123',
  })
  contactNumber?: string;

  @ApiPropertyOptional({
    description: 'Patient email address',
    example: 'john.doe@email.com',
  })
  email?: string;
}

export class HospitalDiagnosisDto {
  @ApiProperty({
    description: 'ICD-10 diagnosis code',
    example: 'I10',
  })
  code: string;

  @ApiProperty({
    description: 'Diagnosis description',
    example: 'Essential (primary) hypertension',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Severity level of diagnosis',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
  })
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export class HospitalTreatmentDto {
  @ApiProperty({
    description: 'Unique treatment or procedure identifier',
    example: 'TREAT-789',
  })
  treatmentId: string;

  @ApiProperty({
    description: 'Description of treatment or procedure performed',
    example: 'Laparoscopic cholecystectomy',
  })
  description: string;

  @ApiProperty({
    description: 'Cost of treatment in local currency',
    example: 12500.50,
  })
  cost: number;

  @ApiProperty({
    description: 'Date of treatment in ISO format',
    example: '2025-01-10',
  })
  date: string;
}

export class HospitalClaimDataDto {
  @ApiProperty({
    description: 'Unique claim identifier from hospital',
    example: 'CLM-2025-000456',
  })
  claimId: string;

  @ApiProperty({
    description: 'Patient information',
    type: HospitalPatientDto,
  })
  patient: HospitalPatientDto;

  @ApiProperty({
    description: 'List of diagnoses',
    type: () => [HospitalDiagnosisDto],
  })
  diagnoses: HospitalDiagnosisDto[];

  @ApiProperty({
    description: 'List of treatments and procedures',
    type: () => [HospitalTreatmentDto],
  })
  treatments: HospitalTreatmentDto[];

  @ApiProperty({
    description: 'Total claim amount in local currency',
    example: 25000.00,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Hospital admission date',
    example: '2025-01-09',
  })
  admissionDate: string;

  @ApiPropertyOptional({
    description: 'Hospital discharge date',
    example: '2025-01-15',
  })
  dischargeDate?: string;

  @ApiProperty({
    description: 'Hospital or clinic identifier',
    example: 'HOSPITAL-A001',
  })
  hospitalId: string;

  @ApiProperty({
    description: 'Hospital or clinic name',
    example: 'General Medical Center',
  })
  hospitalName: string;

  @ApiProperty({
    description: 'Current claim status',
    enum: ['pending', 'verified', 'rejected'],
    example: 'pending',
  })
  status: 'pending' | 'verified' | 'rejected';
}

export class HospitalVerificationDto {
  @ApiProperty({
    description: 'Claim ID being verified',
    example: 'CLM-2025-000456',
  })
  claimId: string;

  @ApiProperty({
    description: 'Whether the claim was verified as valid',
    example: true,
  })
  verified: boolean;

  @ApiProperty({
    description: 'Date of verification in ISO format',
    example: '2025-01-16T14:30:00Z',
  })
  verificationDate: string;

  @ApiProperty({
    description: 'Staff member who performed verification',
    example: 'admin@nestera.io',
  })
  verifiedBy: string;

  @ApiPropertyOptional({
    description: 'Additional verification notes',
    example: 'Documents verified with hospital',
  })
  notes?: string;
}
