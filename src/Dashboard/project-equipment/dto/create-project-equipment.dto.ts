import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    IsDateString,
    ValidateIf,
} from 'class-validator';
import { EquipmentSource } from 'src/DB/Models/Project-Equipment/project-equipment.schema';

export class CreateProjectEquipmentDto {
    @IsEnum(EquipmentSource)
    @IsNotEmpty()
    equipmentSource: EquipmentSource;

    // ============ لو COMPANY_ASSET ============
    @ValidateIf((o) => o.equipmentSource === 'COMPANY_ASSET')
    @IsString()
    @IsNotEmpty()
    assetId?: string;

    // ============ لو EXTERNAL_RENTAL ============
    @ValidateIf((o) => o.equipmentSource === 'EXTERNAL_RENTAL')
    @IsString()
    @IsNotEmpty()
    equipmentName?: string;

    @ValidateIf((o) => o.equipmentSource === 'EXTERNAL_RENTAL')
    @IsString()
    @IsOptional()
    supplierName?: string;

    // ============ تفاصيل الإيجار ============
    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    numberOfDays: number;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    dailyRentalRate: number;

    // ============ تكاليف التشغيل (اختيارية) ============
    @IsNumber()
    @Min(0)
    @IsOptional()
    fuelCost?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    operatorCost?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    maintenanceCost?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    otherOperatingCost?: number;

    // ============ التواريخ ============
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}