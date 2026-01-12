import {
    IsEnum,
    IsMongoId,
    IsNumber,
    IsOptional,
    Min,
    IsDateString,
} from 'class-validator';
import { Types } from 'mongoose';

export enum RefundMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
}

export class CreateSupplierRefundDto {
    @IsMongoId()
    supplierId: Types.ObjectId;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsEnum(RefundMethod)
    method: RefundMethod;

    @IsDateString()
    refundDate: string;

    @IsOptional()
    notes?: string;
}
