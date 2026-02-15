import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { GeneralExpense, TGeneralExpense, ExpenseCategory } from './general-expense.schema';

interface DropdownExpense {
    _id: Types.ObjectId;
    title: string;
    amount: number;
    expenseDate: Date;
    mainCategory: string;
}

interface ExpenseSummary {
    _id: string;
    totalAmount: number;
    count: number;
}

@Injectable()
export class GeneralExpenseRepository extends DBService<TGeneralExpense> {
    constructor(
        @InjectModel(GeneralExpense.name)
        private readonly expenseModel: Model<TGeneralExpense>,
    ) {
        super(expenseModel);
    }

    // ============================================
    // Basic CRUD Operations
    // ============================================

    async findById(id: string | Types.ObjectId): Promise<TGeneralExpense | null> {
        return this.expenseModel
            .findById(id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

    async findActiveById(id: string | Types.ObjectId): Promise<TGeneralExpense | null> {
        return this.expenseModel
            .findOne({ _id: id, isActive: true })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

    async findByExpenseNo(expenseNo: number): Promise<TGeneralExpense | null> {
        return this.expenseModel
            .findOne({ expenseNo })
            .populate('createdBy', 'name email')
            .exec();
    }

    // ============================================
    // Query by Category
    // ============================================

    async findByMainCategory(
        mainCategory: ExpenseCategory,
    ): Promise<TGeneralExpense[]> {
        return this.expenseModel
            .find({
                mainCategory,
                isActive: true,
            })
            .populate('createdBy', 'name email')
            .sort({ expenseDate: -1 })
            .exec();
    }

    async findBySubCategory(
        mainCategory: ExpenseCategory,
        subCategory: string,
    ): Promise<TGeneralExpense[]> {
        return this.expenseModel
            .find({
                mainCategory,
                subCategory: new RegExp(subCategory.trim(), 'i'),
                isActive: true,
            })
            .populate('createdBy', 'name email')
            .sort({ expenseDate: -1 })
            .exec();
    }

    // ============================================
    // Date Range Queries
    // ============================================

    async findByDateRange(
        startDate: Date,
        endDate: Date,
    ): Promise<TGeneralExpense[]> {
        return this.expenseModel
            .find({
                expenseDate: { $gte: startDate, $lte: endDate },
                isActive: true,
            })
            .populate('createdBy', 'name email')
            .sort({ expenseDate: -1 })
            .exec();
    }

    async findByDateRangeAndCategory(
        startDate: Date,
        endDate: Date,
        mainCategory: ExpenseCategory,
    ): Promise<TGeneralExpense[]> {
        return this.expenseModel
            .find({
                expenseDate: { $gte: startDate, $lte: endDate },
                mainCategory,
                isActive: true,
            })
            .populate('createdBy', 'name email')
            .sort({ expenseDate: -1 })
            .exec();
    }

    // ============================================
    // Search
    // ============================================

    async searchExpenses(searchTerm: string): Promise<TGeneralExpense[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return this.expenseModel
                .find({ isActive: true })
                .populate('createdBy', 'name email')
                .sort({ expenseDate: -1 })
                .limit(100)
                .exec();
        }

        const searchRegex = new RegExp(searchTerm.trim(), 'i');

        return this.expenseModel
            .find({
                isActive: true,
                $or: [
                    { title: searchRegex },
                    { subCategory: searchRegex },
                    { vendorName: searchRegex },
                    { notes: searchRegex },
                    { referenceNo: searchRegex },
                ],
            })
            .populate('createdBy', 'name email')
            .sort({ expenseDate: -1 })
            .exec();
    }

    // ============================================
    // Dropdown
    // ============================================

    async findForDropdown(
        filter: FilterQuery<TGeneralExpense> = {},
    ): Promise<DropdownExpense[]> {
        return this.expenseModel
            .find({ ...filter, isActive: true })
            .select('_id title amount expenseDate mainCategory')
            .sort({ expenseDate: -1 })
            .lean<DropdownExpense[]>()
            .exec();
    }

    // ============================================
    // Activation/Deactivation (Soft Delete)
    // ============================================

    async deactivate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TGeneralExpense | null> {
        return this.expenseModel
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
    ): Promise<TGeneralExpense | null> {
        return this.expenseModel
            .findByIdAndUpdate(
                id,
                { isActive: true, updatedBy: userId },
                { new: true },
            )
            .exec();
    }

    // ============================================
    // Reports & Analytics
    // ============================================

    async getTotalsByCategory(
        startDate?: Date,
        endDate?: Date,
    ): Promise<ExpenseSummary[]> {
        const matchStage: any = { isActive: true };

        if (startDate && endDate) {
            matchStage.expenseDate = { $gte: startDate, $lte: endDate };
        }

        return this.expenseModel
            .aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$mainCategory',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { totalAmount: -1 } },
            ])
            .exec();
    }

    async getTotalAmount(startDate?: Date, endDate?: Date): Promise<number> {
        const matchStage: any = { isActive: true };

        if (startDate && endDate) {
            matchStage.expenseDate = { $gte: startDate, $lte: endDate };
        }

        const result = await this.expenseModel
            .aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                    },
                },
            ])
            .exec();

        return result.length > 0 ? result[0].total : 0;
    }

    async getMonthlyExpenses(year: number): Promise<any[]> {
        return this.expenseModel
            .aggregate([
                {
                    $match: {
                        isActive: true,
                        expenseDate: {
                            $gte: new Date(year, 0, 1),
                            $lt: new Date(year + 1, 0, 1),
                        },
                    },
                },
                {
                    $group: {
                        _id: { $month: '$expenseDate' },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ])
            .exec();
    }

    // ============================================
    // Pagination
    // ============================================

    async findWithPagination(
        page: number = 1,
        limit: number = 20,
        filter: FilterQuery<TGeneralExpense> = {},
    ): Promise<{ data: TGeneralExpense[]; total: number; page: number; totalPages: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.expenseModel
                .find({ ...filter, isActive: true })
                .populate('createdBy', 'name email')
                .sort({ expenseDate: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.expenseModel.countDocuments({ ...filter, isActive: true }),
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
}