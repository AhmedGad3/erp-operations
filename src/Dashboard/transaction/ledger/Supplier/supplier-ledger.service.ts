import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
    SupplierTransaction,
    SupplierTransactionDocument,
} from "../../../../DB/Models/Transaction/supplier/supplier-transaction.schema";
import { CounterService } from "../../common/counter.service";

@Injectable()
export class SupplierLedgerService {
    constructor(
        @InjectModel(SupplierTransaction.name)
        private readonly ledgerModel: Model<SupplierTransactionDocument>,

        private readonly counterService: CounterService,
    ) { }

    /**
     * ⚠️ WARNING: NO SESSION - Development only
     */
    async createTransaction(data: {
        supplierId: Types.ObjectId;
        debit: number;
        credit: number;
        discountAmount?: number;
        type: string;
        referenceType: string;
        referenceId: Types.ObjectId;
        createdBy: Types.ObjectId;
    }) {
        const discountAmount = data.discountAmount ?? 0;

            const totalCredit = data.credit + discountAmount

        if (data.debit < 0 || data.credit < 0) {
            throw new BadRequestException('Debit/Credit cannot be negative');
        }

        if (data.debit === 0 && data.credit === 0) {
            throw new BadRequestException('Debit or Credit must have a value');
        }

        if (data.debit > 0 && data.credit > 0) {
            throw new BadRequestException('Only one of Debit or Credit is allowed');
        }
        // Get last balance
        const last = await this.ledgerModel
            .findOne({ supplierId: data.supplierId })
            .sort({ transactionDate: -1, _id: -1 });

        const lastBalance = last?.balanceAfter ?? 0;

        // Generate number
        const transactionNo = await this.counterService.getNext('supplier-transaction');

        const balanceAfter = lastBalance + data.debit - totalCredit;
        

        // Create transaction
        const transaction = await this.ledgerModel.create({
            ...data,
            transactionNo,
            credit: totalCredit,     
        discountAmount, 
            balanceAfter,
            transactionDate: new Date(),
        });

        return transaction;
    }

    async getCurrentBalance(supplierId: Types.ObjectId): Promise<number> {
        const last = await this.ledgerModel
            .findOne({ supplierId })
            .sort({ transactionDate: -1, _id: -1 })
            .select('balanceAfter');

        return last?.balanceAfter ?? 0;
    }

    async findAll() {
        return this.ledgerModel.find().sort({ transactionDate: -1 });
    }

    async findBySupplier(supplierId: string) {
        return this.ledgerModel
            .find({ supplierId })
            .sort({ transactionDate: -1 });
    }
}