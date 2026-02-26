import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { AssetInvoice, TAssetInvoice } from './Asset-Invoice.schema';

@Injectable()
export class AssetInvoiceRepository extends DBService<TAssetInvoice> {
    constructor(
        @InjectModel(AssetInvoice.name)
        private readonly invoiceModel: Model<TAssetInvoice>,
    ) {
        super(invoiceModel);
    }

    async findById(id: string | Types.ObjectId): Promise<TAssetInvoice | null> {
        return this.invoiceModel
            .findById(id)
            .populate('asset')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

    
    async findActiveById(id: string | Types.ObjectId): Promise<TAssetInvoice | null> {
        return this.invoiceModel
            .findOne({ _id: id, isActive: true })
            .populate('asset')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

  async findByAssetId(assetId: string | Types.ObjectId): Promise<TAssetInvoice | null> {
    return this.invoiceModel
        .findOne({ asset: new Types.ObjectId(assetId), isActive: true })
        .populate('asset')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .exec();
}

    async findAllActive(): Promise<TAssetInvoice[]> {
        return this.invoiceModel
            .find({ isActive: true })
            .populate('asset')
            .populate('createdBy', 'name email')
            .sort({ invoiceDate: -1 })
            .exec();
    }

    async findWithPagination(
        page: number = 1,
        limit: number = 20,
        filter: FilterQuery<TAssetInvoice> = {},
    ): Promise<{ data: TAssetInvoice[]; total: number; page: number; totalPages: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.invoiceModel
                .find({ ...filter, isActive: true })
                .populate('asset')
                .populate('createdBy', 'name email')
                .sort({ invoiceDate: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.invoiceModel.countDocuments({ ...filter, isActive: true }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async deactivate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TAssetInvoice | null> {
        return this.invoiceModel
            .findByIdAndUpdate(
                id,
                { isActive: false, updatedBy: userId },
                { new: true },
            )
            .exec();
    }

    async getTotalAmount(startDate?: Date, endDate?: Date): Promise<number> {
        const matchStage: any = { isActive: true };

        if (startDate && endDate) {
            matchStage.invoiceDate = { $gte: startDate, $lte: endDate };
        }

        const result = await this.invoiceModel
            .aggregate([
                { $match: matchStage },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ])
            .exec();

        return result.length > 0 ? result[0].total : 0;
    }
}