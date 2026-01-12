// dto/create-client-payment.dto.ts

import {
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    ValidateIf,
    IsDateString,
} from 'class-validator';
import { Types } from 'mongoose';
import { Transform } from 'class-transformer';

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CHEQUE = 'CHEQUE',
}

export class CreateClientPaymentDto {
    @IsMongoId()
    @IsNotEmpty()
    projectId: Types.ObjectId;

    @IsNumber()
    @Min(0.01)
    @IsNotEmpty()
    totalAmount: number;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    contractPayment: number;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    additionalPayment: number;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    method: PaymentMethod;

    @ValidateIf(o => o.method === PaymentMethod.TRANSFER)
    @IsNotEmpty()
    transferRef?: string;

    @ValidateIf(o => o.method === PaymentMethod.CHEQUE)
    @IsNotEmpty()
    chequeNo?: string;

    @IsDateString()
    @IsNotEmpty()
    paymentDate: string;

    @IsOptional()
    notes?: string;
}