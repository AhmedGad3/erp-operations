

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { ClientSession, Connection, Model, Types } from "mongoose";
import { SupplierPayment } from "../../../../DB/Models/Transaction/supplier/payment.schema";
import { PurchaseInvoice, PurchaseInvoiceStatus } from "../../../../DB/Models/Transaction/supplier/purchase-invoice.schema";
import { SupplierRefund } from "../../../../DB/Models/Transaction/supplier/supplier-refund.schema";
import { SupplierLedgerService } from "../../ledger/Supplier/supplier-ledger.service";
import { CounterService } from "../../common/counter.service";
import { I18nContext, I18nService } from "nestjs-i18n";
import { CreatePaymentDto } from "./dto/create-supplier-payment.dto";
import { TUser } from "../../../../DB";
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

        @InjectConnection()
        private readonly connection: Connection,
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ===============================
    // Create Supplier Payment
    // ===============================
    async createPayment(dto: CreatePaymentDto, user: TUser) {
    const lang = this.getLang();
    const discountAmount = dto.discountAmount ?? 0;
    const totalAmount = dto.amount + discountAmount;

    // ✅ Check balance قبل الـ session
    const currentBalance = await this.ledgerService.getCurrentBalance(dto.supplierId);

    if (currentBalance <= 0) {
        throw new BadRequestException(
            this.i18n.translate('payments.errors.noBalance', { lang }),
        );
    }

    if (totalAmount > currentBalance) {
        throw new BadRequestException(
            this.i18n.translate('payments.errors.exceedsBalance', {
                lang,
                args: { amount: totalAmount, balance: currentBalance },
            }),
        );
    }

    if (discountAmount >= currentBalance) {
        throw new BadRequestException(
            this.i18n.translate('payments.errors.discountExceedsBalance', {
                lang,
                args: { discount: discountAmount, balance: currentBalance },
            }),
        );
    }

    const session = await this.connection.startSession();

    try {
        let createdPayment: SupplierPayment | null = null;

        await session.withTransaction(async () => {
            // 1️⃣ Payment Number
            const paymentNo = await this.counterService.getNext('supplier-payment', session);

            // 2️⃣ Create Payment
            const [payment] = await this.paymentModel.create([{
                paymentNo,
                supplierId: dto.supplierId,
                amount: dto.amount,
                discountAmount,
                method: dto.method,
                transferRef: dto.transferRef,
                chequeNo: dto.chequeNo,
                paymentDate: new Date(dto.paymentDate),
                notes: dto.notes,
                createdBy: user._id,
            }], { session });

            // 3️⃣ Ledger Entry
            await this.ledgerService.createTransaction({
                supplierId: dto.supplierId,
                debit: 0,
                credit: dto.amount,
                discountAmount,
                type: 'payment',
                referenceType: 'SupplierPayment',
                referenceId: payment._id,
                createdBy: user._id as Types.ObjectId,
            }, session);

            // 4️⃣ Allocate to invoices
            await this.allocatePaymentToInvoices(dto.supplierId, totalAmount, session);

            createdPayment = payment;
        });

        if (!createdPayment) {
            throw new BadRequestException('Failed to create supplier payment');
        }

        return createdPayment;
    } finally {
        await session.endSession();
    }
}
    // ===============================
    // Allocate payment
    // ===============================
    private async allocatePaymentToInvoices(
        supplierId: Types.ObjectId,
        amount: number,
        session?: ClientSession,
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
            .session(session || null)
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

            await invoice.save(session ? { session } : undefined);
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
                this.i18n.translate('payments.errors.noRefundDue', {
                    lang,
                    args: { balance: currentBalance }
                }),
            );
        }

        // ✅ Check 2: مبلغ الـ Refund <= الرصيد السالب
        const maxRefund = Math.abs(currentBalance); // القيمة المطلقة

        if (dto.amount > maxRefund) {
            throw new BadRequestException(
                this.i18n.translate('payments.errors.refundExceedsBalance', {
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
        return this.paymentModel.find().populate('supplierId', 'nameAr nameEn code').populate('createdBy', 'name email').sort({ paymentDate: -1 });
    }

    async getAllRefunds(){
        return this.refundModel.find().populate('supplierId', 'nameAr nameEn code').populate('createdBy', 'name email').sort({ refundDate: -1 });
    }

    async findById(id: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('payments.errors.invalidId', { lang })
            );
        }

        const payment = await this.paymentModel.findById(id);

        if (!payment) {
            throw new NotFoundException(
                this.i18n.translate('payments.errors.notFound', { lang }),
            );
        }

        return payment;
    }

    async findBySupplier(supplierId: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(supplierId)) {
            throw new BadRequestException(
                this.i18n.translate('payments.errors.invalidId', { lang })
            );
        }

        const payments = await this.paymentModel
            .find({ supplierId })
            .sort({ paymentDate: -1 })
            .populate('createdBy', 'name');

        if (!payments.length) {
            throw new NotFoundException(
                this.i18n.translate('payments.errors.noPaymentsFound', { lang }),
            );
        }

        return payments;
    }
}
