import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { SubcontractorWork, TSubcontractorWork } from './subcontractor-work.schema';

interface DropdownSubcontractorWork {
    _id: Types.ObjectId;
    contractorName: string;
    itemDescription: string;
    totalAmount: number;
}

interface WorkSummary {
    _id: string;
    totalAmount: number;
    count: number;
}

@Injectable()
export class SubcontractorWorkRepository extends DBService<TSubcontractorWork> {
    constructor(
        @InjectModel(SubcontractorWork.name)
        private readonly workModel: Model<TSubcontractorWork>,
    ) {
        super(workModel);
    }

    async findById(id: string | Types.ObjectId): Promise<TSubcontractorWork | null> {
        return this.workModel
            .findById(id as Types.ObjectId)
            .populate('project', 'name projectNo')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

    async findActiveById(id: string | Types.ObjectId): Promise<TSubcontractorWork | null> {
        return this.workModel
            .findOne({ _id: id, isActive: true })
            .populate('project', 'name projectNo')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

    async findByWorkNo(workNo: number): Promise<TSubcontractorWork | null> {
        return this.workModel
            .findOne({ workNo })
            .populate('project', 'name projectNo')
            .populate('createdBy', 'name email')
            .exec();
    }

    // ============================================
    // Query by Project
    // ============================================

    // ✅ فلتر isActive: true عشان نتجاهل المحذوف soft-delete
    async findByProject(projectId: string | Types.ObjectId): Promise<TSubcontractorWork[]> {
        return this.workModel
            .find({
                project: new Types.ObjectId(projectId.toString()),
                isActive: true,
            })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByProjectAndContractor(
        projectId: string | Types.ObjectId,
        contractorName: string,
    ): Promise<TSubcontractorWork[]> {
        return this.workModel
            .find({
                project: new Types.ObjectId(projectId.toString()),
                contractorName: new RegExp(contractorName.trim(), 'i'),
                isActive: true,
            })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .exec();
    }

    // ============================================
    // Query by Contractor
    // ============================================

    async findByContractor(contractorName: string): Promise<TSubcontractorWork[]> {
        return this.workModel
            .find({
                contractorName: new RegExp(contractorName.trim(), 'i'),
                isActive: true,
            })
            .populate('project', 'name projectNo')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .exec();
    }

    // ============================================
    // Search
    // ============================================

    // ✅ أضفنا projectId كـ optional filter + isActive: true
    async searchWorks(
        searchTerm: string,
        projectId?: string | Types.ObjectId,
    ): Promise<TSubcontractorWork[]> {
        const baseFilter: FilterQuery<TSubcontractorWork> = { isActive: true };

        if (projectId) {
            baseFilter.project = new Types.ObjectId(projectId.toString());
        }

        if (!searchTerm || searchTerm.trim().length === 0) {
            return this.workModel
                .find(baseFilter)
                .populate('project', 'name projectNo')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(100)
                .exec();
        }

        const searchRegex = new RegExp(searchTerm.trim(), 'i');

        return this.workModel
            .find({
                ...baseFilter,
                $or: [
                    { contractorName: searchRegex },
                    { itemDescription: searchRegex },
                    { unit: searchRegex },
                    { notes: searchRegex },
                ],
            })
            .populate('project', 'name projectNo')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findForDropdown(
        filter: FilterQuery<TSubcontractorWork> = {},
    ): Promise<DropdownSubcontractorWork[]> {
        return this.workModel
            .find({ isActive: true, ...filter })
            .select('_id contractorName itemDescription totalAmount')
            .sort({ createdAt: -1 })
            .lean<DropdownSubcontractorWork[]>()
            .exec();
    }

    // ============================================
    // Activation/Deactivation (Soft Delete)
    // ============================================

    async deactivate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TSubcontractorWork | null> {
        return this.workModel
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
    ): Promise<TSubcontractorWork | null> {
        return this.workModel
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

    async getTotalsByContractor(projectId?: string | Types.ObjectId): Promise<WorkSummary[]> {
        const matchStage: FilterQuery<TSubcontractorWork> = { isActive: true };

        if (projectId) {
            matchStage.project = new Types.ObjectId(projectId.toString());
        }

        return this.workModel
            .aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$contractorName',
                        totalAmount: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { totalAmount: -1 } },
            ])
            .exec();
    }

    async getTotalAmountByProject(projectId: string | Types.ObjectId): Promise<number> {
        const result = await this.workModel
            .aggregate([
                {
                    $match: {
                        project: new Types.ObjectId(projectId.toString()),
                        isActive: true,
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' },
                    },
                },
            ])
            .exec();

        return result.length > 0 ? result[0].total : 0;
    }

    // ============================================
    // Pagination
    // ============================================

    async findWithPagination(
        page: number = 1,
        limit: number = 20,
        filter: FilterQuery<TSubcontractorWork> = {},
    ): Promise<{ data: TSubcontractorWork[]; total: number; page: number; totalPages: number }> {
        const skip = (page - 1) * limit;
        const finalFilter = { ...filter, isActive: true };

        const [data, total] = await Promise.all([
            this.workModel
                .find(finalFilter)
                .populate('project', 'name projectNo')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.workModel.countDocuments(finalFilter),
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
}