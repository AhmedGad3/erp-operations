

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { SupplierPayment } from "src/DB/Models/Transaction/supplier/payment.schema";
import { PurchaseInvoice, PurchaseInvoiceStatus } from "src/DB/Models/Transaction/supplier/purchase-invoice.schema";
import { SupplierRefund } from "src/DB/Models/Transaction/supplier/supplier-refund.schema";
import { SupplierLedgerService } from "../../ledger/Supplier/supplier-ledger.service";
import { CounterService } from "../../common/counter.service";
import { I18nContext, I18nService } from "nestjs-i18n";
import { CreatePaymentDto } from "./dto/create-supplier-payment.dto";
import { TUser } from "src/DB";
import { CreateSupplierRefundDto } from "./dto/create-supplier-refund.dto";

@Injectable()
export class SupplierPaymentService {
    constructor(
        @InjectModel(SupplierPayment.name)
        private readonly paymentModel: Model<SupplierPayment>,

        @InjectModel(SupplierRefund.name)
        private readonly refundModel: Model<SupplierRefund>,

        @InjectModel(PurchaseInvoice.name)
        private readonly invoiceModel: Model<PurchaseInvoice>,

        private readonly ledgerService: SupplierLedgerService,
        private readonly counterService: CounterService,
        private readonly i18n: I18nService,
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ===============================
    // Create Supplier Payment
    // ===============================
    async createPayment(dto: CreatePaymentDto, user: TUser) {
        const lang = this.getLang();

        // ✅ Get current balance
        const currentBalance =
            await this.ledgerService.getCurrentBalance(dto.supplierId);

        // ✅ Check 1: الرصيد لازم يكون موجب (فيه مديونية)
        if (currentBalance <= 0) {
            throw new BadRequestException(
                this.i18n.translate('payment.errors.noBalance', { lang }),
            );
        }

        // ✅ Check 2: المبلغ لازم يكون <= الرصيد (no overpayment)
        if (dto.amount > currentBalance) {
            throw new BadRequestException(
                this.i18n.translate('payment.errors.exceedsBalance', {
                    lang,
                    args: { amount: dto.amount, balance: currentBalance },
                }),
            );
        }

        // 1️⃣ Payment Number
        const paymentNo =
            await this.counterService.getNext('supplier-payment');

        // 2️⃣ Create Payment
        const payment = await this.paymentModel.create({
            paymentNo,
            supplierId: dto.supplierId,
            amount: dto.amount,
            method: dto.method,
            transferRef: dto.transferRef,
            chequeNo: dto.chequeNo,
            paymentDate: new Date(dto.paymentDate),
            notes: dto.notes,
            createdBy: user._id,
        });

        // 3️⃣ Ledger Entry (CREDIT)
        await this.ledgerService.createTransaction({
            supplierId: dto.supplierId,
            debit: 0,
            credit: dto.amount,
            type: 'payment',
            referenceType: 'SupplierPayment',
            referenceId: payment._id,
            createdBy: user._id as Types.ObjectId,
        });

        // 4️⃣ Allocate to invoices
        await this.allocatePaymentToInvoices(dto.supplierId, dto.amount);

        return payment;
    }

    // ===============================
    // Allocate payment
    // ===============================
    private async allocatePaymentToInvoices(
        supplierId: Types.ObjectId,
        amount: number,
    ) {
        let remaining = amount;

        const openInvoices = await this.invoiceModel
            .find({
                supplierId,
                status: {
                    $in: [
                        PurchaseInvoiceStatus.OPEN,
                        PurchaseInvoiceStatus.PARTIAL,
                    ],
                },
            })
            .sort({ invoiceDate: 1 });

        for (const invoice of openInvoices) {
            if (remaining <= 0) break;

            const allocated = Math.min(
                invoice.remainingAmount,
                remaining,
            );

            invoice.paidAmount += allocated;
            invoice.remainingAmount -= allocated;

            invoice.status =
                invoice.remainingAmount === 0
                    ? PurchaseInvoiceStatus.PAID
                    : PurchaseInvoiceStatus.PARTIAL;

            await invoice.save();
            remaining -= allocated;
        }
    }

    // ===============================
    // Refund Supplier
    // ===============================
    async createRefund(dto: CreateSupplierRefundDto, user: TUser) {
        const lang = this.getLang();

        // ✅ Get current balance
        const currentBalance =
            await this.ledgerService.getCurrentBalance(dto.supplierId);

        // ✅ Check 1: الرصيد لازم يكون سالب (المورد مدينلك)
        if (currentBalance >= 0) {
            throw new BadRequestException(
                this.i18n.translate('payment.errors.noRefundDue', {
                    lang,
                    args: { balance: currentBalance }
                }),
            );
        }

        // ✅ Check 2: مبلغ الـ Refund <= الرصيد السالب
        const maxRefund = Math.abs(currentBalance); // القيمة المطلقة

        if (dto.amount > maxRefund) {
            throw new BadRequestException(
                this.i18n.translate('payment.errors.refundExceedsBalance', {
                    lang,
                    args: {
                        amount: dto.amount,
                        maxRefund: maxRefund
                    }
                }),
            );
        }

        // 1️⃣ Refund Number
        const refundNo =
            await this.counterService.getNext('supplier-refund');

        // 2️⃣ Create Refund
        const refund = await this.refundModel.create({
            refundNo,
            supplierId: dto.supplierId,
            amount: dto.amount,
            method: dto.method,
            refundDate: dto.refundDate,
            notes: dto.notes,
            createdBy: user._id,
        });

        // 3️⃣ Ledger Entry (DEBIT)
        await this.ledgerService.createTransaction({
            supplierId: dto.supplierId,
            debit: dto.amount,
            credit: 0,
            type: 'refund',
            referenceType: 'SupplierRefund',
            referenceId: refund._id,
            createdBy: user._id as Types.ObjectId,
        });

        return refund;
    }

    // ===============================
    // Queries
    // ===============================
    async getAllPayments() {
        return this.paymentModel.find().sort({ paymentDate: -1 });
    }

    async findById(id: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('payment.errors.invalidId', { lang })
            );
        }

        const payment = await this.paymentModel.findById(id);

        if (!payment) {
            throw new NotFoundException(
                this.i18n.translate('payment.errors.notFound', { lang }),
            );
        }

        return payment;
    }

    async findBySupplier(supplierId: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(supplierId)) {
            throw new BadRequestException(
                this.i18n.translate('payment.errors.invalidId', { lang })
            );
        }

        const payments = await this.paymentModel
            .find({ supplierId })
            .sort({ paymentDate: -1 })
            .populate('createdBy', 'name');

        if (!payments.length) {
            throw new NotFoundException(
                this.i18n.translate('payment.errors.noPaymentsFound', { lang }),
            );
        }

        return payments;
    }
}
// import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model, Types } from "mongoose";
// import { SupplierPayment } from "src/DB/Models/Transaction/payment.schema";
// import { PurchaseInvoice, PurchaseInvoiceStatus } from "src/DB/Models/Transaction/purchase-invoice.schema";
// import { SupplierRefund } from "src/DB/Models/Transaction/supplier-refund.schema";
// import { SupplierLedgerService } from "../ledger/supplier-ledger.service";
// import { CounterService } from "../common/counter.service";
// import { I18nContext, I18nService } from "nestjs-i18n";
// import { CreatePaymentDto } from "./dto/create-payment.dto";
// import { TUser } from "src/DB";
// import { CreateSupplierRefundDto } from "./dto/create-supplier-refund.dto";

// @Injectable()
// export class PaymentService {
//     constructor(
//         @InjectModel(SupplierPayment.name)
//         private readonly paymentModel: Model<SupplierPayment>,

//         @InjectModel(SupplierRefund.name)
//         private readonly refundModel: Model<SupplierRefund>,

//         @InjectModel(PurchaseInvoice.name)
//         private readonly invoiceModel: Model<PurchaseInvoice>,

//         private readonly ledgerService: SupplierLedgerService,
//         private readonly counterService: CounterService,
//         private readonly i18n: I18nService,
//     ) { }

//     private getLang(): string {
//         return I18nContext.current()?.lang || 'ar';
//     }

//     // ===============================
//     // Create Supplier Payment
//     // ===============================
//     async createPayment(dto: CreatePaymentDto, user: TUser) {
//         const lang = this.getLang();

//         const currentBalance =
//             await this.ledgerService.getCurrentBalance(dto.supplierId);

//         if (currentBalance <= 0) {
//             throw new BadRequestException(
//                 this.i18n.translate('payment.errors.noBalance', { lang }),
//             );
//         }

//         if (dto.amount > currentBalance) {
//             throw new BadRequestException(
//                 this.i18n.translate('payment.errors.exceedsBalance', {
//                     lang,
//                     args: { amount: dto.amount, balance: currentBalance },
//                 }),
//             );
//         }

//         // 1️⃣ Payment Number
//         const paymentNo =
//             await this.counterService.getNext('supplier-payment');

//         // 2️⃣ Create Payment
//         const payment = await this.paymentModel.create({
//             paymentNo,
//             supplierId: dto.supplierId,
//             amount: dto.amount,
//             method: dto.method,
//             transferRef: dto.transferRef,
//             chequeNo: dto.chequeNo,
//             paymentDate: new Date(dto.paymentDate),
//             notes: dto.notes,
//             createdBy: user._id,
//         });

//         // 3️⃣ Ledger Entry (CREDIT)
//         await this.ledgerService.createTransaction({
//             supplierId: dto.supplierId,
//             debit: 0,
//             credit: dto.amount,
//             type: 'payment',
//             referenceType: 'SupplierPayment',
//             referenceId: payment._id,
//             createdBy: user._id as Types.ObjectId,
//         });

//         // 4️⃣ Allocate to invoices
//         await this.allocatePaymentToInvoices(dto.supplierId, dto.amount);

//         return payment;
//     }

//     // ===============================
//     // Allocate payment
//     // ===============================
//     private async allocatePaymentToInvoices(
//         supplierId: Types.ObjectId,
//         amount: number,
//     ) {
//         let remaining = amount;

//         const openInvoices = await this.invoiceModel
//             .find({
//                 supplierId,
//                 status: {
//                     $in: [
//                         PurchaseInvoiceStatus.OPEN,
//                         PurchaseInvoiceStatus.PARTIAL,
//                     ],
//                 },
//             })
//             .sort({ invoiceDate: 1 });

//         for (const invoice of openInvoices) {
//             if (remaining <= 0) break;

//             const allocated = Math.min(
//                 invoice.remainingAmount,
//                 remaining,
//             );

//             invoice.paidAmount += allocated;
//             invoice.remainingAmount -= allocated;

//             invoice.status =
//                 invoice.remainingAmount === 0
//                     ? PurchaseInvoiceStatus.PAID
//                     : PurchaseInvoiceStatus.PARTIAL;

//             await invoice.save();
//             remaining -= allocated;
//         }
//     }

//     // ===============================
//     // Refund Supplier
//     // ===============================
//     async createRefund(dto: CreateSupplierRefundDto, user: TUser) {
//         const refundNo =
//             await this.counterService.getNext('supplier-refund');

//         const refund = await this.refundModel.create({
//             refundNo,
//             supplierId: dto.supplierId,
//             amount: dto.amount,
//             method: dto.method,
//             refundDate: dto.refundDate,
//             notes: dto.notes,
//             createdBy: user._id,
//         });

//         // Ledger Entry (DEBIT)
//         await this.ledgerService.createTransaction({
//             supplierId: dto.supplierId,
//             debit: dto.amount,
//             credit: 0,
//             type: 'refund',
//             referenceType: 'SupplierRefund',
//             referenceId: refund._id,
//             createdBy: user._id as Types.ObjectId,
//         });


//         return refund;
//     }

//     // ===============================
//     // Queries
//     // ===============================
//     async getAllPayments() {
//         return this.paymentModel.find().sort({ paymentDate: -1 });
//     }

//     async findById(id: string) {
//         if (!Types.ObjectId.isValid(id)) {
//             throw new BadRequestException('Invalid payment ID');
//         }

//         const payment = await this.paymentModel.findById(id);

//         if (!payment) {
//             throw new NotFoundException(
//                 this.i18n.translate('payment.errors.notFound', {
//                     lang: this.getLang(),
//                 }),
//             );
//         }

//         return payment;
//     }

//     async findBySupplier(supplierId: string) {
//         if (!Types.ObjectId.isValid(supplierId)) {
//             throw new BadRequestException('Invalid supplier ID');
//         }

//         const payments = await this.paymentModel
//             .find({ supplierId })
//             .sort({ paymentDate: -1 })
//             .populate('createdBy', 'name');

//         if (!payments.length) {
//             throw new NotFoundException(
//                 this.i18n.translate(
//                     'payment.errors.noPaymentsFound',
//                     { lang: this.getLang() },
//                 ),
//             );
//         }

//         return payments;
//     }
// }
