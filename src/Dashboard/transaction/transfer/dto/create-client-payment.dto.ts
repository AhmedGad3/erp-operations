// src/routes/project/dto/create-customer-payment.dto.ts

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
import { PaymentMethod } from '../../payment/supplier/dto/create-supplier-payment.dto';

export class CreateCustomerPaymentDto {
    @IsMongoId()
    @IsNotEmpty()
    projectId: Types.ObjectId;

    @IsNumber()
    @Min(0.01)
    @IsNotEmpty()
    amount: number;

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