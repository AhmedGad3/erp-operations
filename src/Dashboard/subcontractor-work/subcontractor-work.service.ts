// subcontractor-work.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreateSubcontractorWorkDto } from './dto/create-subcontractor-work.dto';
import { UpdateSubcontractorWorkDto } from './dto/update-subcontractor-work.dto';
import { TUser } from '../../DB';
import { ProjectRepository } from '../../DB/Models/Project/project.repository';
import { SubcontractorWorkRepository } from 'src/DB/Models/Subcontractor-Work/subcontractor-work.repository';
import { TSubcontractorWork } from 'src/DB/Models/Subcontractor-Work/subcontractor-work.schema';

@Injectable()
export class SubcontractorWorkService {
    constructor(
        private readonly subcontractorWorkRepository: SubcontractorWorkRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Add Work to Project
    async addWorkToProject(
        projectId: string,
        createDto: CreateSubcontractorWorkDto,
        user: TUser,
    ): Promise<TSubcontractorWork> {
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

        const totalAmount = createDto.quantity * createDto.unitPrice;

       const lastWork = await this.subcontractorWorkRepository.findOne({}, { sort: { workNo: -1 } });
const workNo = lastWork ? lastWork.workNo + 1 : 1;

const workData = {
    workNo,
    project: new Types.ObjectId(projectId),
    contractorName: createDto.contractorName.trim(),
    itemDescription: createDto.itemDescription.trim(),
    unit: createDto.unit?.trim(),
    quantity: createDto.quantity,
    unitPrice: createDto.unitPrice,
    totalAmount,
    notes: createDto.notes?.trim(),
    createdBy: user._id as Types.ObjectId,
};

        const work = await this.subcontractorWorkRepository.create(workData);

        await this.updateProjectSubcontractorCosts(projectId);

        return work;
    }

    // ✅ Get All Works for Project
    async getProjectWorks(projectId: string): Promise<TSubcontractorWork[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.subcontractorWorkRepository.findByProject(projectId);
    }

    // ✅ Get Work by ID
    async getWorkById(id: string): Promise<TSubcontractorWork> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('subcontractorWork.errors.invalidId', { lang }),
            );
        }

        const work = await this.subcontractorWorkRepository.findById(id);
        if (!work) {
            throw new NotFoundException(
                this.i18n.translate('subcontractorWork.errors.notFound', { lang }),
            );
        }

        return work;
    }

    // ✅ Update Work
    async updateWork(
        id: string,
        updateDto: UpdateSubcontractorWorkDto,
        user: TUser,
    ): Promise<TSubcontractorWork> {
        const lang = this.getLang();

        const work = await this.subcontractorWorkRepository.findById(id);
        if (!work) {
            throw new NotFoundException(
                this.i18n.translate('subcontractorWork.errors.notFound', { lang }),
            );
        }

        const quantity = updateDto.quantity ?? work.quantity;
        const unitPrice = updateDto.unitPrice ?? work.unitPrice;
        const totalAmount = quantity * unitPrice;

        const updateData: any = {
            ...updateDto,
            totalAmount,
            updatedBy: user._id as Types.ObjectId,
        };

        if (updateDto.contractorName) updateData.contractorName = updateDto.contractorName.trim();
        if (updateDto.itemDescription) updateData.itemDescription = updateDto.itemDescription.trim();
        if (updateDto.unit) updateData.unit = updateDto.unit.trim();
        if (updateDto.notes) updateData.notes = updateDto.notes.trim();

        Object.assign(work, updateData);
        await work.save();

      const projectId = (work.project as any)?._id
    ? (work.project as any)._id.toString()
    : work.project.toString();

        await this.updateProjectSubcontractorCosts(projectId);

        return work;
    }

    // ✅ Delete Work
    async deleteWork(id: string, user: TUser): Promise<TSubcontractorWork> {
        const lang = this.getLang();

        const work = await this.subcontractorWorkRepository.findById(id);
        if (!work) {
            throw new NotFoundException(
                this.i18n.translate('subcontractorWork.errors.notFound', { lang }),
            );
        }

        const projectId = work.project instanceof Types.ObjectId
            ? work.project.toString()
            : work.project;

        await this.subcontractorWorkRepository.deactivate(id, user._id as Types.ObjectId);

        await this.updateProjectSubcontractorCosts(projectId);

        return work;
    }

    // ✅ Search
    async searchWorks(projectId: string, searchTerm: string): Promise<TSubcontractorWork[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.subcontractorWorkRepository.searchWorks(searchTerm);
    }

    // ✅ Update Project Subcontractor Costs
    private async updateProjectSubcontractorCosts(projectId: string | Types.ObjectId): Promise<void> {
        const id = projectId instanceof Types.ObjectId ? projectId.toString() : projectId;
        const totalAmount = await this.subcontractorWorkRepository.getTotalAmountByProject(id);

        const project = await this.projectRepository.findById(id);
        if (!project) return;

        project.subcontractorCosts = totalAmount;
        project.totalCosts =
            (project.materialCosts || 0) +
            (project.laborCosts || 0) +
            (project.equipmentCosts || 0) +
            totalAmount +
            (project.otherCosts || 0);

        await project.save();
    }
}