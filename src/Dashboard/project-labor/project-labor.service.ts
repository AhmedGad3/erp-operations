import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreateProjectLaborDto } from './dto/create-project-labor.dto';
import { UpdateProjectLaborDto } from './dto/update-project-labor.dto';
import { TUser } from '../../DB';
import { ProjectRepository } from '../../DB/Models/Project/project.repository';
import { ProjectLaborRepository } from 'src/DB/Models/ProjectLabor/project-labor.repository';
import { TProjectLabor } from 'src/DB/Models/ProjectLabor/project-labor.schema';

@Injectable()
export class ProjectLaborService {
    constructor(
        private readonly projectLaborRepository: ProjectLaborRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Add Labor to Project
    async addLaborToProject(
        projectId: string,
        createDto: CreateProjectLaborDto,
        user: TUser,
    ): Promise<TProjectLabor> {
        const lang = this.getLang();

        // Validate Project
        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        // Calculate costs
        const laborCost = createDto.numberOfDays * createDto.dailyRate;
        const materialCost = createDto.materialCost || 0;
        const totalCost = laborCost + materialCost;

        const laborData = {
            projectId: new Types.ObjectId(projectId),
            workerName: createDto.workerName.trim(),
            specialty: createDto.specialty.trim(),
            taskDescription: createDto.taskDescription?.trim() || '',
            numberOfDays: createDto.numberOfDays,
            dailyRate: createDto.dailyRate,
            laborCost,
            materialCost,
            totalCost,
            startDate: new Date(createDto.startDate),
            endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
            notes: createDto.notes?.trim() || '',
            createdBy: user._id as Types.ObjectId,
        };

        const labor = await this.projectLaborRepository.create(laborData);

        // Update project laborCosts
        await this.updateProjectLaborCosts(projectId);

        return labor;
    }

    // ✅ Get All Labor for Project
    async getProjectLabor(projectId: string): Promise<TProjectLabor[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectLaborRepository.findByProjectId(projectId);
    }

    // ✅ Get Labor by ID
    async getLaborById(id: string): Promise<TProjectLabor> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('projectLabor.errors.invalidId', { lang }),
            );
        }

        const labor = await this.projectLaborRepository.findByIdWithPopulate(id);
        if (!labor) {
            throw new NotFoundException(
                this.i18n.translate('projectLabor.errors.notFound', { lang }),
            );
        }

        return labor;
    }

    // ✅ Update Labor
    async updateLabor(
        id: string,
        updateDto: UpdateProjectLaborDto,
        user: TUser,
    ): Promise<TProjectLabor> {
        // Use findById instead of findByIdWithPopulate to avoid populated projectId
        const labor = await this.projectLaborRepository.findById(id);
        if (!labor) {
            throw new NotFoundException(
                this.i18n.translate('projectLabor.errors.notFound', { lang: this.getLang() }),
            );
        }

        // Recalculate costs if needed
        const numberOfDays = updateDto.numberOfDays ?? labor.numberOfDays;
        const dailyRate = updateDto.dailyRate ?? labor.dailyRate;
        const laborCost = numberOfDays * dailyRate;

        const materialCost = updateDto.materialCost ?? labor.materialCost;
        const totalCost = laborCost + materialCost;

        // Prepare update object
        const updateData: any = {
            ...updateDto,
            laborCost,
            totalCost,
            updatedBy: user._id as Types.ObjectId,
        };

        if (updateDto.startDate) updateData.startDate = new Date(updateDto.startDate);
        if (updateDto.endDate) updateData.endDate = new Date(updateDto.endDate);
        if (updateDto.workerName) updateData.workerName = updateDto.workerName.trim();
        if (updateDto.specialty) updateData.specialty = updateDto.specialty.trim();
        if (updateDto.taskDescription) updateData.taskDescription = updateDto.taskDescription.trim();
        if (updateDto.notes) updateData.notes = updateDto.notes.trim();

        Object.assign(labor, updateData);
        await labor.save();

        // Update project labor costs
        const projectId = labor.projectId instanceof Types.ObjectId 
            ? labor.projectId.toString() 
            : labor.projectId;
        
        await this.updateProjectLaborCosts(projectId);

        return labor;
    }

    // ✅ Delete Labor
    async deleteLabor(id: string, user: TUser): Promise<TProjectLabor> {
        const labor = await this.projectLaborRepository.findById(id);
        if (!labor) {
            throw new NotFoundException(
                this.i18n.translate('projectLabor.errors.notFound', { lang: this.getLang() }),
            );
        }

        const projectId = labor.projectId instanceof Types.ObjectId 
            ? labor.projectId.toString() 
            : labor.projectId;

        // Delete the labor record
        await this.projectLaborRepository.delete(id);

        // Update project laborCosts
        await this.updateProjectLaborCosts(projectId);

        return labor;
    }

    // ✅ Get Labor by Date Range
    async getLaborByDateRange(
        projectId: string,
        startDate: string,
        endDate: string,
    ): Promise<TProjectLabor[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectLaborRepository.findByDateRange(
            projectId,
            new Date(startDate),
            new Date(endDate),
        );
    }

    // ✅ Search by Worker Name
    async searchByWorkerName(
        projectId: string,
        workerName: string,
    ): Promise<TProjectLabor[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectLaborRepository.findByWorkerName(projectId, workerName);
    }

    // ✅ Search by Specialty
    async searchBySpecialty(
        projectId: string,
        specialty: string,
    ): Promise<TProjectLabor[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectLaborRepository.findBySpecialty(projectId, specialty);
    }

    // ✅ Update Project Labor Costs
    private async updateProjectLaborCosts(projectId: string | Types.ObjectId): Promise<void> {
        const id = projectId instanceof Types.ObjectId ? projectId.toString() : projectId;
        const totalCost = await this.projectLaborRepository.calculateTotalCostByProject(id);

        const project = await this.projectRepository.findById(id);
        if (!project) return;

        project.laborCosts = totalCost;
        project.totalCosts =
            (project.materialCosts || 0) +
            totalCost +
            (project.equipmentCosts || 0) +
            (project.otherCosts || 0);

        await project.save();
    }
}