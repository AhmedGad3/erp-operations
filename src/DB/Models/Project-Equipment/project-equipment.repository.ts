import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { ProjectEquipment, TProjectEquipment } from './project-equipment.schema';

@Injectable()
export class ProjectEquipmentRepository extends DBService<TProjectEquipment> {
    constructor(
        @InjectModel(ProjectEquipment.name)
        private readonly projectEquipmentModel: Model<TProjectEquipment>,
    ) {
        super(projectEquipmentModel);
    }

    // ✅ Find by Project ID
    async findByProjectId(projectId: string | Types.ObjectId): Promise<TProjectEquipment[]> {
        return this.projectEquipmentModel
            .find({ projectId })
            .populate('assetId', 'nameAr nameEn code assetTypeAr assetTypeEn')
            .populate('createdBy', 'nameAr nameEn email')
            .populate('updatedBy', 'nameAr nameEn email')
            .sort({ startDate: -1 })
            .exec();
    }

    // ✅ Find by Asset ID
    async findByAssetId(assetId: string | Types.ObjectId): Promise<TProjectEquipment[]> {
        return this.projectEquipmentModel
            .find({ assetId, isActive: true })
            .populate('projectId', 'nameAr nameEn code')
            .sort({ startDate: -1 })
            .exec();
    }

    // ✅ Find by ID with Populate
    async findByIdWithPopulate(id: string | Types.ObjectId): Promise<TProjectEquipment | null> {
        return this.projectEquipmentModel
            .findById(id)
            .populate('assetId', 'nameAr nameEn code assetTypeAr assetTypeEn status')
            .populate('projectId', 'nameAr nameEn code')
            .populate('createdBy', 'nameAr nameEn email')
            .populate('updatedBy', 'nameAr nameEn email')
            .exec();
    }

    // ✅ Calculate Total Equipment Cost for Project
    async calculateTotalCostByProject(projectId: string | Types.ObjectId): Promise<number> {
        const result = await this.projectEquipmentModel.aggregate([
            { 
                $match: { 
                    projectId: new Types.ObjectId(projectId as string),
                    isActive: true 
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    total: { $sum: '$totalCost' } 
                } 
            },
        ]);

        return result[0]?.total || 0;
    }

    // ✅ Deactivate
    async deactivate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TProjectEquipment | null> {
        return this.projectEquipmentModel
            .findByIdAndUpdate(
                id,
                { isActive: false, updatedBy: userId },
                { new: true },
            )
            .exec();
    }

    async activate (
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TProjectEquipment | null> {
        return this.projectEquipmentModel
            .findByIdAndUpdate(
                id,
                { isActive: true, updatedBy: userId },
                { new: true },
            )
            .exec();
    }

    // ✅ Find Active Equipment by Date Range
    async findByDateRange(
        projectId: string | Types.ObjectId,
        startDate: Date,
        endDate: Date,
    ): Promise<TProjectEquipment[]> {
        return this.projectEquipmentModel
            .find({
                projectId,
                isActive: true,
                $or: [
                    { startDate: { $gte: startDate, $lte: endDate } },
                    { endDate: { $gte: startDate, $lte: endDate } },
                    {
                        startDate: { $lte: startDate },
                        $or: [
                            { endDate: { $gte: endDate } },
                            { endDate: null },
                        ],
                    },
                ],
            })
            .populate('assetId')
            .sort({ startDate: -1 })
            .exec();
    }
}