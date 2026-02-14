import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { ProjectMiscellaneous, TProjectMiscellaneous } from './project-miscellaneous.schema';

@Injectable()
export class ProjectMiscellaneousRepository extends DBService<TProjectMiscellaneous> {
    constructor(
        @InjectModel(ProjectMiscellaneous.name)
        private readonly projectMiscellaneousModel: Model<TProjectMiscellaneous>,
    ) {
        super(projectMiscellaneousModel);
    }

    // ✅ Find by Project ID
    async findByProjectId(projectId: string | Types.ObjectId): Promise<TProjectMiscellaneous[]> {
         const objectId =
                typeof projectId === 'string'
                    ? new Types.ObjectId(projectId)
                    : projectId;
        return this.projectMiscellaneousModel
            .find({ projectId: objectId })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ date: -1 })
            .exec();
    }

    // ✅ Find by ID with Populate
    async findByIdWithPopulate(id: string | Types.ObjectId): Promise<TProjectMiscellaneous | null> {
        return this.projectMiscellaneousModel
            .findById(id)
            .populate('projectId', 'nameAr nameEn code')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .exec();
    }

    // ✅ Calculate Total Miscellaneous Cost for Project
    async calculateTotalCostByProject(
  projectId: string | Types.ObjectId,
): Promise<number> {

  if (!projectId) return 0;

  const objectId =
    typeof projectId === 'string'
      ? new Types.ObjectId(projectId)
      : projectId;

  const result = await this.projectMiscellaneousModel.aggregate([
    {
      $match: {
        projectId: objectId,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  return result[0]?.total || 0;
}


    // ✅ Find by Date Range
    async findByDateRange(
        projectId: string | Types.ObjectId,
        startDate: Date,
        endDate: Date,
    ): Promise<TProjectMiscellaneous[]> {
        return this.projectMiscellaneousModel
            .find({
                projectId,
                date: { $gte: startDate, $lte: endDate },
            })
            .sort({ date: -1 })
            .exec();
    }

    // ✅ Find by Category
    async findByCategory(
        projectId: string | Types.ObjectId,
        category: string,
    ): Promise<TProjectMiscellaneous[]> {
        return this.projectMiscellaneousModel
            .find({
                projectId,
                category: { $regex: category, $options: 'i' },
            })
            .sort({ date: -1 })
            .exec();
    }

    // ✅ Delete (Hard Delete)
    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await this.projectMiscellaneousModel.findByIdAndDelete(id).exec();
        return !!result;
    }

    // ✅ Get All Categories for a Project (distinct)
    async getProjectCategories(projectId: string | Types.ObjectId): Promise<string[]> {
        const categories = await this.projectMiscellaneousModel
            .distinct('category', { projectId, category: {  $ne: '' } })
            .exec();
        
        return categories;
    }
}