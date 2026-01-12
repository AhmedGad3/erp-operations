import { FilterQuery, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DBService } from 'src/DB/db.service';
import { Supplier, TSupplier } from './supplier.schema';

export interface DropdownSupplier {
    _id: Types.ObjectId;
    name: string;
}

export class SupplierRepository extends DBService<TSupplier> {
    constructor(
        @InjectModel(Supplier.name)
        private readonly supplierModel: Model<TSupplier>,
    ) {
        super(supplierModel);
    }

    async findById(
        id: string | Types.ObjectId,
    ): Promise<TSupplier | null> {
        return this.supplierModel.findById(id).exec();
    }

    async findByName(nameAr?: string, nameEn?: string): Promise<TSupplier | null> {
        if (!nameAr && !nameEn) return null;

        const orConditions: FilterQuery<TSupplier>[] = [];
        if (nameAr) orConditions.push({ nameAr });
        if (nameEn) orConditions.push({ nameEn });

        return this.findOne({ $or: orConditions });
    }

    async findByCode(code: string): Promise<TSupplier | null> {
        return this.findOne({ code: code.toUpperCase() });
    }

    async findActive(): Promise<TSupplier[] | null> {
        return this.find({ isActive: true });
    }

    async searchSuppliers(
        searchTerm: string,
    ): Promise<TSupplier[] | null> {
        if (!searchTerm || !searchTerm.trim()) {
            return this.find({ isActive: true });
        }

        const regex = new RegExp(searchTerm.trim(), 'i');

        return this.supplierModel
            .find({
                isActive: true,
                $or: [
                    { name: regex },
                    { phone: regex },
                    { email: regex },
                ],
            })
            .sort({ name: 1 })
            .exec();
    }

    async findForDropdown(
        filter: FilterQuery<TSupplier> = {},
    ): Promise<DropdownSupplier[]> {
        return this.supplierModel
            .find({ ...filter, isActive: true })
            .select('_id name')
            .sort({ name: 1 })
            .lean<DropdownSupplier[]>()
            .exec();
    }

    async deactivate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TSupplier | null> {
        return this.supplierModel
            .findByIdAndUpdate(
                id,
                { isActive: false, updatedBy: userId },
                { new: true },
            )
            .exec();
    }

    async activate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TSupplier | null> {
        return this.supplierModel
            .findByIdAndUpdate(
                id,
                { isActive: true, updatedBy: userId },
                { new: true },
            )
            .exec();
    }
}
