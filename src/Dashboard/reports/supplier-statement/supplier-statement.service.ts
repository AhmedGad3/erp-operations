import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nService, I18nContext } from 'nestjs-i18n';

import { Supplier } from 'src/DB/Models/Supplier/supplier.schema';
import { SupplierTransaction } from 'src/DB/Models/Transaction/supplier/supplier-transaction.schema';
import { SupplierStatementDto } from './dto';

@Injectable()
export class SupplierStatementService {
    constructor(
        @InjectModel(Supplier.name)
        private readonly supplierModel: Model<Supplier>,
        @InjectModel(SupplierTransaction.name)
        private readonly transactionModel: Model<SupplierTransaction>,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    async generateStatement(dto: SupplierStatementDto) {
        const lang = this.getLang();
        const { supplierId, startDate, endDate } = dto;

        // التحقق من صحة الـ Supplier ID
        if (!Types.ObjectId.isValid(supplierId)) {
            throw new BadRequestException(
                this.i18n.translate('suppliers.errors.invalidId', { lang }),
            );
        }

        // جلب بيانات المورد
        const supplier = await this.supplierModel
            .findOne({ _id: supplierId, isActive: true })
            .lean();

        if (!supplier) {
            throw new NotFoundException(
                this.i18n.translate('suppliers.errors.notFound', { lang }),
            );
        }

        // بناء query للتاريخ
        const dateQuery: any = { supplierId: new Types.ObjectId(supplierId) };

        if (startDate || endDate) {
            dateQuery.transactionDate = {};
            if (startDate) {
                dateQuery.transactionDate.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery.transactionDate.$lte = end;
            }
        }

        // حساب Opening Balance (قبل الفترة المحددة)
        let openingBalance = 0;
        if (startDate) {
            const openingTransactions = await this.transactionModel
                .find({
                    supplierId: new Types.ObjectId(supplierId),
                    transactionDate: { $lt: new Date(startDate) },
                })
                .sort({ transactionDate: 1, createdAt: 1 });

            if (openingTransactions.length > 0) {
                openingBalance =
                    openingTransactions[openingTransactions.length - 1].balanceAfter;
            }
        }

        // جلب المعاملات في الفترة المحددة
        const transactions = await this.transactionModel
            .find(dateQuery)
            .populate('createdBy', 'name')
            .sort({ transactionDate: 1, createdAt: 1 })
            .lean();

        // حساب الإجماليات
        let totalDebit = 0;
        let totalCredit = 0;

        transactions.forEach((transaction) => {
            totalDebit += transaction.debit || 0;
            totalCredit += transaction.credit || 0;
        });

        const closingBalance =
            transactions.length > 0
                ? transactions[transactions.length - 1].balanceAfter
                : openingBalance;

        // إعداد التقرير
        const statement = {
            supplier: {
                _id: supplier._id,
                nameAr: supplier.nameAr,
                nameEn: supplier.nameEn,
                code: supplier.code,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
            },
            period: {
                startDate: startDate || null,
                endDate: endDate || null,
            },
            openingBalance,
            transactions: transactions.map((t) => ({
                transactionNo: t.transactionNo,
                date: t.transactionDate,
                type: t.type,
                description: t.description,
                referenceType: t.referenceType,
                referenceId: t.referenceId,
                debit: t.debit,
                credit: t.credit,
                balance: t.balanceAfter,
                createdBy: t.createdBy,
            })),
            summary: {
                totalDebit,
                totalCredit,
                closingBalance,
            },
        };

        return statement;
    }

    async generateAllSuppliersStatement(startDate?: string, endDate?: string) {
        const lang = this.getLang();

        // جلب جميع الموردين النشطين
        const suppliers = await this.supplierModel
            .find({ isActive: true })
            .select('_id nameAr nameEn code')
            .lean();

        if (!suppliers || suppliers.length === 0) {
            throw new NotFoundException(
                this.i18n.translate('suppliers.errors.notFound', { lang }),
            );
        }

        // بناء query للتاريخ
        const dateQuery: any = {};
        if (startDate || endDate) {
            dateQuery.transactionDate = {};
            if (startDate) {
                dateQuery.transactionDate.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery.transactionDate.$lte = end;
            }
        }

        // جلب جميع المعاملات
        const allTransactions = await this.transactionModel
            .find(dateQuery)
            .sort({ supplierId: 1, transactionDate: 1 })
            .lean();

        // تجميع البيانات لكل مورد
        const statements = await Promise.all(
            suppliers.map(async (supplier) => {
                const supplierTransactions = allTransactions.filter(
                    (t) => t.supplierId.toString() === supplier._id.toString(),
                );

                // حساب Opening Balance
                let openingBalance = 0;
                if (startDate) {
                    const openingTrans = await this.transactionModel
                        .find({
                            supplierId: supplier._id,
                            transactionDate: { $lt: new Date(startDate) },
                        })
                        .sort({ transactionDate: 1 })
                        .limit(1)
                        .lean();

                    if (openingTrans.length > 0) {
                        openingBalance = openingTrans[0].balanceAfter;
                    }
                }

                let totalDebit = 0;
                let totalCredit = 0;

                supplierTransactions.forEach((t) => {
                    totalDebit += t.debit || 0;
                    totalCredit += t.credit || 0;
                });

                const closingBalance =
                    supplierTransactions.length > 0
                        ? supplierTransactions[supplierTransactions.length - 1]
                              .balanceAfter
                        : openingBalance;

                return {
                    supplier: {
                        _id: supplier._id,
                        nameAr: supplier.nameAr,
                        nameEn: supplier.nameEn,
                        code: supplier.code,
                    },
                    openingBalance,
                    totalDebit,
                    totalCredit,
                    closingBalance,
                    transactionsCount: supplierTransactions.length,
                };
            }),
        );

        return {
            period: {
                startDate: startDate || null,
                endDate: endDate || null,
            },
            statements: statements.filter((s) => s.transactionsCount > 0 || s.openingBalance !== 0),
            summary: {
                totalSuppliers: statements.length,
                totalDebit: statements.reduce((sum, s) => sum + s.totalDebit, 0),
                totalCredit: statements.reduce((sum, s) => sum + s.totalCredit, 0),
            },
        };
    }
}
