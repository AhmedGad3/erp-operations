import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { AssetInvoicePaymentMethod } from 'src/DB/Models/AssetInvoice/Asset-Invoice.schema';

export class CreateAssetInvoiceDto {
    @IsString()
    @IsNotEmpty()
    vendorName: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @IsDateString()
    @IsNotEmpty()
    invoiceDate: string;

    @IsEnum(AssetInvoicePaymentMethod)
    @IsNotEmpty()
    paymentMethod: AssetInvoicePaymentMethod;

    @IsString()
    @IsOptional()
    referenceNo?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsNotEmpty()
    assetId: string;
}