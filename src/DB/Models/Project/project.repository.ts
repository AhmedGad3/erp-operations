import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { Project, ProjectStatus, TProject } from './project.schema';

@Injectable()
export class ProjectRepository extends DBService<TProject> {
    constructor(
        @InjectModel(Project.name)
        private readonly projectModel: Model<TProject>,
    ) {
        super(projectModel);
    }

    async findById(id: string | Types.ObjectId): Promise<TProject | null> {
        return this.projectModel
            .findById(id)
            .populate('clientId', 'nameAr nameEn phone email -_id')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name')
            .exec();
    }

    async findByName(
        nameAr?: string,
        nameEn?: string,
    ): Promise<TProject | null> {
        if (!nameAr && !nameEn) return null;

        const orConditions: FilterQuery<TProject>[] = [];
        if (nameAr) orConditions.push({ nameAr });
        if (nameEn) orConditions.push({ nameEn });

        return this.findOne({ $or: orConditions });
    }

    async findByCode(code: string): Promise<TProject | null> {
        return this.findOne({ code: code.toUpperCase() });
    }

    async findByClientId(
        clientId: string | Types.ObjectId,
    ): Promise<TProject[]> {
        return this.projectModel
            .find({ clientId, isActive: true })
            .populate('clientId', 'nameAr nameEn phone -_id')
            .sort({ startDate: -1 })
            .populate('createdBy', 'name')
            .exec();
    }

    async findByStatus(status: ProjectStatus): Promise<TProject[]> {
        return this.projectModel
            .find({ status, isActive: true })
            .populate('clientId', 'nameAr nameEn')
            .sort({ startDate: -1 })
            .exec();
    }

    async searchProjects(searchTerm: string): Promise<TProject[]> {
        if (!searchTerm || !searchTerm.trim()) {
            return this.projectModel
                .find({ isActive: true })
                .populate('clientId', 'nameAr nameEn')
                .sort({ startDate: -1 })
                .exec();
        }

        const regex = new RegExp(searchTerm.trim(), 'i');
        return this.projectModel
            .find({
              
                $or: [
                    { nameAr: regex },
                    { nameEn: regex },
                    { code: regex },
                    { location: regex },
                    { projectManager: regex },
                    { siteEngineer: regex },
                ],
            })
            .populate('clientId', 'nameAr nameEn')
            .sort({ startDate: -1 })
            .exec();
    }

    // ============ Update Methods ============
    /**
     * Update material costs
     */
    async updateMaterialCosts(
        id: string | Types.ObjectId,
        amount: number,
        isAddition: boolean = true,
    ): Promise<TProject | null> {
        const project = await this.projectModel.findById(id);
        if (!project) return null;

        project.materialCosts += isAddition ? amount : -amount;

        project.totalCosts =
            project.materialCosts +
            project.laborCosts +
            project.equipmentCosts +
            project.otherCosts;

        return project.save();
    }

    /**
     * Update equipment costs
     */
    async updateEquipmentCosts(
        id: string | Types.ObjectId,
        amount: number,
    ): Promise<TProject | null> {
        const project = await this.projectModel.findById(id);
        if (!project) return null;

        project.equipmentCosts += amount;

        project.totalCosts =
            project.materialCosts +
            project.laborCosts +
            project.equipmentCosts +
            project.otherCosts;

        return project.save();
    }

    /**
     * Update total invoiced
     */
    async updateTotalInvoiced(
        id: string | Types.ObjectId,
        amount: number,
    ): Promise<TProject | null> {
        const project = await this.projectModel.findById(id);
        if (!project) return null;

        project.totalInvoiced += amount;
        return project.save();
    }

    /**
     * Update actual revenue
     */
    async updateTotalPaid(
        id: string | Types.ObjectId,
        amount: number,
    ): Promise<TProject | null> {
        const project = await this.projectModel.findById(id);
        if (!project) return null;

        project.totalPaid += amount;
        return project.save();
    }

    // ============ Statistics ============

    /**
     * Get project statistics
     */
    async getProjectStats(projectId: string | Types.ObjectId) {
        const project = await this.projectModel.findById(projectId);
        if (!project) return null;

        // Cast to TProject to access virtual properties
        const projectWithVirtuals = project as TProject;

        return {
            contractAmount: projectWithVirtuals.contractAmount,
            totalPaid: projectWithVirtuals.totalPaid,
            contractRemaining: projectWithVirtuals.contractRemaining,
            totalInvoiced: projectWithVirtuals.totalInvoiced,
            totalCosts: projectWithVirtuals.totalCosts,
            expectedProfit: projectWithVirtuals.expectedProfit,
            realizedProfit: projectWithVirtuals.realizedProfit,
            completionPercentage: projectWithVirtuals.completionPercentage,
        };
    }

    /**
     * Get client's total statistics across all projects
     */
    async getClientStats(clientId: string | Types.ObjectId) {
        const projects = await this.projectModel.find({
            clientId,
            isActive: true,
        });

        const stats = projects.reduce(
            (acc, project) => {
                const proj = project.toObject({ virtuals: true }) as TProject;
                acc.totalContractAmount += proj.contractAmount;
                acc.totalPaid += proj.totalPaid;
                acc.totalCosts += proj.totalCosts;
                acc.totalExpectedProfit += proj.expectedProfit;
                acc.totalRealizedProfit += proj.realizedProfit;
                return acc;
            },
            {
                totalProjects: projects.length,
                totalContractAmount: 0,
                totalPaid: 0,
                totalCosts: 0,
                totalExpectedProfit: 0,
                totalRealizedProfit: 0,
            },
        );

        return stats;
    }
}