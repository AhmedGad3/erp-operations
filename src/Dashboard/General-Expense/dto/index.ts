import { 
    IsString, 
    IsNumber, 
    IsEnum, 
    IsDateString, 
    IsOptional, 
    Min, 
    IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory, PaymentMethod } from 'src/DB/Models/General-Expense/general-expense.schema';
import { PartialType } from '@nestjs/mapped-types';

export class CreateGeneralExpenseDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @IsEnum(ExpenseCategory)
    @IsNotEmpty()
    mainCategory: ExpenseCategory;

    @IsString()
    @IsOptional()
    subCategory?: string;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;

    @IsString()
    @IsOptional()
    referenceNo?: string;

    @IsDateString()
    @IsNotEmpty()
    expenseDate: string;

    @IsString()
    @IsOptional()
    vendorName?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateGeneralExpenseDto extends PartialType(CreateGeneralExpenseDto) {}