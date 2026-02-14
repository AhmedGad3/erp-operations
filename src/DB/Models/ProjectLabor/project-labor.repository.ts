import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { ProjectLabor, TProjectLabor } from './project-labor.schema';

@Injectable()
export class ProjectLaborRepository extends DBService<TProjectLabor> {
    constructor(
        @InjectModel(ProjectLabor.name)
        private readonly projectLaborModel: Model<TProjectLabor>,
    ) {
        super(projectLaborModel);
    }

    // ✅ Find by Project ID
    async findByProjectId(projectId: string | Types.ObjectId): Promise<TProjectLabor[]> {
         const objectId =
                typeof projectId === 'string'
                    ? new Types.ObjectId(projectId)
                    : projectId;
        return this.projectLaborModel
            .find({ projectId: objectId })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ startDate: -1 })
            .exec();
    }

    // ✅ Find by ID with Populate
    async findByIdWithPopulate(id: string | Types.ObjectId): Promise<TProjectLabor | null> {
        return this.projectLaborModel
            .findById(id)
            .populate('projectId', 'nameAr nameEn code')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

    // ✅ Calculate Total Labor Cost for Project
  async calculateTotalCostByProject(
  projectId: string | Types.ObjectId,
): Promise<number> {

  if (!projectId) {
    return 0;
  }

  if (
    typeof projectId === 'string' &&
    !Types.ObjectId.isValid(projectId)
  ) {
    return 0;
  }

  const objectId =
    typeof projectId === 'string'
      ? new Types.ObjectId(projectId)
      : projectId;

  const result = await this.projectLaborModel.aggregate([
    {
      $match: { projectId: objectId },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalCost' },
      },
    },
  ]);

  return result[0]?.total || 0;
}



    // ✅ Find Labor by Date Range
    async findByDateRange(
        projectId: string | Types.ObjectId,
        startDate: Date,
        endDate: Date,
    ): Promise<TProjectLabor[]> {
        return this.projectLaborModel
            .find({
                projectId,
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
            .sort({ startDate: -1 })
            .exec();
    }

    // ✅ Find by Worker Name
    async findByWorkerName(
        projectId: string | Types.ObjectId,
        workerName: string,
    ): Promise<TProjectLabor[]> {
        return this.projectLaborModel
            .find({
                projectId,
                workerName: { $regex: workerName, $options: 'i' },
            })
            .sort({ startDate: -1 })
            .exec();
    }

    // ✅ Find by Specialty
    async findBySpecialty(
        projectId: string | Types.ObjectId,
        specialty: string,
    ): Promise<TProjectLabor[]> {
        return this.projectLaborModel
            .find({
                projectId,
                specialty: { $regex: specialty, $options: 'i' },
            })
            .sort({ startDate: -1 })
            .exec();
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
    const result = await this.projectLaborModel.findByIdAndDelete(id).exec();
    return !!result;
}
}