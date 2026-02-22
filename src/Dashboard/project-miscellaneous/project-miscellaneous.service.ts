import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreateProjectMiscellaneousDto } from './dto/create-project-miscellaneous.dto';
import { UpdateProjectMiscellaneousDto } from './dto/update-project-miscellaneous.dto';
import { TUser } from '../../DB';
import { ProjectRepository } from '../../DB/Models/Project/project.repository';
import { ProjectMiscellaneousRepository } from 'src/DB/Models/project-miscellaneous/project-miscellaneous.repository';
import { TProjectMiscellaneous } from 'src/DB/Models/project-miscellaneous/project-miscellaneous.schema';
import { ProjectStatus } from 'src/DB/Models/Project/project.schema';

@Injectable()
export class ProjectMiscellaneousService {
    constructor(
        private readonly projectMiscellaneousRepository: ProjectMiscellaneousRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    private isProjectLocked(status: ProjectStatus): boolean {
        return [
            ProjectStatus.ON_HOLD,
            ProjectStatus.COMPLETED,
            ProjectStatus.CANCELLED,
            ProjectStatus.CLOSED,
        ].includes(status);
    }

    // ✅ Add Miscellaneous to Project
    async addMiscellaneousToProject(
        projectId: string,
        createDto: CreateProjectMiscellaneousDto,
        user: TUser,
    ): Promise<TProjectMiscellaneous> {
        const lang = this.getLang();

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

        if (this.isProjectLocked(project.status)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.projectLocked', { lang }),
            );
        }

        const miscellaneousData = {
            projectId: new Types.ObjectId(projectId),
            date: new Date(createDto.date),
            description: createDto.description.trim(),
            amount: createDto.amount,
            category: createDto.category?.trim() || '',
            notes: createDto.notes?.trim() || '',
            createdBy: user._id as Types.ObjectId,
        };

        const miscellaneous = await this.projectMiscellaneousRepository.create(miscellaneousData);

        await this.updateProjectMiscellaneousCosts(projectId);

        return miscellaneous;
    }

    // ✅ Get All Miscellaneous for Project
    async getProjectMiscellaneous(projectId: string): Promise<TProjectMiscellaneous[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectMiscellaneousRepository.findByProjectId(projectId);
    }

    // ✅ Get Miscellaneous by ID
    async getMiscellaneousById(id: string): Promise<TProjectMiscellaneous> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('projectMiscellaneous.errors.invalidId', { lang }),
            );
        }

        const miscellaneous = await this.projectMiscellaneousRepository.findByIdWithPopulate(id);
        if (!miscellaneous) {
            throw new NotFoundException(
                this.i18n.translate('projectMiscellaneous.errors.notFound', { lang }),
            );
        }

        return miscellaneous;
    }

    // ✅ Update Miscellaneous
    async updateMiscellaneous(
        id: string,
        updateDto: UpdateProjectMiscellaneousDto,
        user: TUser,
    ): Promise<TProjectMiscellaneous> {
        const lang = this.getLang();

        const miscellaneous = await this.projectMiscellaneousRepository.findById(id);
        if (!miscellaneous) {
            throw new NotFoundException(
                this.i18n.translate('projectMiscellaneous.errors.notFound', { lang }),
            );
        }

        const projectId = miscellaneous.projectId instanceof Types.ObjectId
            ? miscellaneous.projectId.toString()
            : miscellaneous.projectId;

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        if (this.isProjectLocked(project.status)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.projectLocked', { lang }),
            );
        }

        const updateData: any = {
            ...updateDto,
            updatedBy: user._id as Types.ObjectId,
        };

        if (updateDto.date) updateData.date = new Date(updateDto.date);
        if (updateDto.description) updateData.description = updateDto.description.trim();
        if (updateDto.category) updateData.category = updateDto.category.trim();
        if (updateDto.notes) updateData.notes = updateDto.notes.trim();

        Object.assign(miscellaneous, updateData);
        await miscellaneous.save();

        await this.updateProjectMiscellaneousCosts(projectId);

        return miscellaneous;
    }

    // ✅ Delete Miscellaneous
    async deleteMiscellaneous(id: string, user: TUser): Promise<TProjectMiscellaneous> {
        const lang = this.getLang();

        const miscellaneous = await this.projectMiscellaneousRepository.findById(id);
        if (!miscellaneous) {
            throw new NotFoundException(
                this.i18n.translate('projectMiscellaneous.errors.notFound', { lang }),
            );
        }

        const projectId = miscellaneous.projectId instanceof Types.ObjectId
            ? miscellaneous.projectId.toString()
            : miscellaneous.projectId;

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        if (this.isProjectLocked(project.status)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.projectLocked', { lang }),
            );
        }

        await this.projectMiscellaneousRepository.delete(id);

        await this.updateProjectMiscellaneousCosts(projectId);

        return miscellaneous;
    }

    // ✅ Get Miscellaneous by Date Range
    async getMiscellaneousByDateRange(
        projectId: string,
        startDate: string,
        endDate: string,
    ): Promise<TProjectMiscellaneous[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectMiscellaneousRepository.findByDateRange(
            projectId,
            new Date(startDate),
            new Date(endDate),
        );
    }

    // ✅ Search by Category
    async searchByCategory(
        projectId: string,
        category: string,
    ): Promise<TProjectMiscellaneous[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectMiscellaneousRepository.findByCategory(projectId, category);
    }

    // ✅ Get All Categories for Project
    async getProjectCategories(projectId: string): Promise<string[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectMiscellaneousRepository.getProjectCategories(projectId);
    }

    // ✅ Update Project Miscellaneous Costs
    private async updateProjectMiscellaneousCosts(projectId: string | Types.ObjectId): Promise<void> {
        const id = projectId instanceof Types.ObjectId ? projectId.toString() : projectId;

        const project = await this.projectRepository.findById(id);
        if (!project) return;

        if (this.isProjectLocked(project.status)) return;

        const totalCost = await this.projectMiscellaneousRepository.calculateTotalCostByProject(id);

        project.otherCosts = totalCost;
        project.totalCosts =
            (project.materialCosts || 0) +
            (project.laborCosts || 0) +
            (project.equipmentCosts || 0) +
            totalCost;

        if (project.status === ProjectStatus.PLANNED) {
            project.status = ProjectStatus.IN_PROGRESS;
        }

        await project.save();
    }
}