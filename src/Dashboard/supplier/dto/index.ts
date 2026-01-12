import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSupplierDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nameAr: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nameEn: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    code: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}


export class UpdateSupplierDto extends PartialType(CreateSupplierDto) { }