import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ExpenseCategory {
    RENT = 'RENT',                    // إيجارات
    UTILITIES = 'UTILITIES',          // مرافق (كهرباء، مياه، غاز)
    MAINTENANCE = 'MAINTENANCE',      // صيانة
    OFFICE_SUPPLIES = 'OFFICE_SUPPLIES', // أدوات مكتبية
    HOSPITALITY = 'HOSPITALITY',      // ضيافة وبوفيه
    COMMUNICATION = 'COMMUNICATION',  // اتصالات وإنترنت
    TRANSPORTATION = 'TRANSPORTATION', // مواصلات
    PROFESSIONAL_FEES = 'PROFESSIONAL_FEES', // رسوم مهنية (محامي، محاسب)
    INSURANCE = 'INSURANCE',          // تأمينات
    MARKETING = 'MARKETING',          // تسويق ودعاية
    SALARIES = 'SALARIES',            // رواتب إدارية
    OTHERS = 'OTHERS',                // أخرى
}

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CHEQUE = 'CHEQUE',
}

@Schema({ timestamps: true })
export class GeneralExpense {
    @Prop({ required: true, unique: true })
    expenseNo: number;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true, type: Number, min: 0 })
    amount: number;

    @Prop({ required: true, enum: ExpenseCategory, default: ExpenseCategory.OTHERS })
    mainCategory: ExpenseCategory;

    @Prop({ trim: true })
    subCategory?: string;

    @Prop({ required: true, enum: PaymentMethod, default: PaymentMethod.CASH })
    paymentMethod: PaymentMethod;

    @Prop({ trim: true })
    referenceNo?: string;

    @Prop({ required: true, type: Date })
    expenseDate: Date;

    @Prop({ trim: true })
    vendorName?: string;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const GeneralExpenseSchema = SchemaFactory.createForClass(GeneralExpense);
export type TGeneralExpense = HydratedDocument<GeneralExpense>;

// Indexes for better query performance
GeneralExpenseSchema.index({ expenseDate: 1, mainCategory: 1 });
GeneralExpenseSchema.index({ expenseNo: 1 });
GeneralExpenseSchema.index({ isActive: 1, expenseDate: -1 });

GeneralExpenseSchema.set('toJSON', { virtuals: true });
GeneralExpenseSchema.set('toObject', { virtuals: true });