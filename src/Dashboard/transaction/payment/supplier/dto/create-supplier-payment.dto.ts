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

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CHEQUE = 'CHEQUE',
}

export class CreatePaymentDto {
    @IsMongoId()
    supplierId: Types.ObjectId;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @ValidateIf(o => o.method === PaymentMethod.TRANSFER)
    @IsNotEmpty()
    transferRef?: string;

    @ValidateIf(o => o.method === PaymentMethod.CHEQUE)
    @IsNotEmpty()
    chequeNo?: string;

    @IsDateString()
    paymentDate: string;

    @IsOptional()
    notes?: string;
}
