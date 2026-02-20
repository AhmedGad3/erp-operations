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

    private validateObjectId(id: string, translationKey: string): void {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate(translationKey, { lang: this.getLang() }),
            );
        }
    }

    // ✅ Add Work to Project
    async addWorkToProject(
        projectId: string,
        createDto: CreateSubcontractorWorkDto,
        user: TUser,
    ): Promise<TSubcontractorWork> {
        this.validateObjectId(projectId, 'projects.errors.invalidId');

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang: this.getLang() }),
            );
        }

        // ✅ لا نحسب totalAmount هنا — pre-save hook في السكيما يتكفل بذلك
        const work = await this.subcontractorWorkRepository.create({
            project: new Types.ObjectId(projectId),
            contractorName: createDto.contractorName.trim(),
            itemDescription: createDto.itemDescription.trim(),
            unit: createDto.unit?.trim(),
            quantity: createDto.quantity,
            unitPrice: createDto.unitPrice,
            notes: createDto.notes?.trim(),
            createdBy: user._id as Types.ObjectId,
        });

        await this.updateProjectSubcontractorCosts(projectId);

        return work;
    }

    // ✅ Get All Works for Project
    async getProjectWorks(projectId: string): Promise<TSubcontractorWork[]> {
        this.validateObjectId(projectId, 'projects.errors.invalidId');
        return this.subcontractorWorkRepository.findByProject(projectId);
    }

    // ✅ Get Work by ID
    async getWorkById(id: string): Promise<TSubcontractorWork> {
        this.validateObjectId(id, 'subcontractorWork.errors.invalidId');

        const work = await this.subcontractorWorkRepository.findById(id);
        if (!work) {
            throw new NotFoundException(
                this.i18n.translate('subcontractorWork.errors.notFound', { lang: this.getLang() }),
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
        this.validateObjectId(id, 'subcontractorWork.errors.invalidId');

        const work = await this.subcontractorWorkRepository.findById(id);
        if (!work) {
            throw new NotFoundException(
                this.i18n.translate('subcontractorWork.errors.notFound', { lang: this.getLang() }),
            );
        }

        // ✅ طبّق التعديلات — pre-save hook هيحسب totalAmount تلقائياً
        if (updateDto.contractorName !== undefined) work.contractorName = updateDto.contractorName.trim();
        if (updateDto.itemDescription !== undefined) work.itemDescription = updateDto.itemDescription.trim();
        if (updateDto.unit !== undefined) work.unit = updateDto.unit.trim();
        if (updateDto.notes !== undefined) work.notes = updateDto.notes.trim();
        if (updateDto.quantity !== undefined) work.quantity = updateDto.quantity;
        if (updateDto.unitPrice !== undefined) work.unitPrice = updateDto.unitPrice;
        work.updatedBy = user._id as Types.ObjectId;

        await work.save(); // pre-save hook يحسب totalAmount

        // ✅ استخرج projectId بشكل آمن
        const projectId = (work.project as any)?._id?.toString() ?? work.project.toString();
        await this.updateProjectSubcontractorCosts(projectId);

        return work;
    }

    // ✅ Delete Work (Soft Delete)
    async deleteWork(id: string, user: TUser): Promise<TSubcontractorWork> {
        this.validateObjectId(id, 'subcontractorWork.errors.invalidId');

        const work = await this.subcontractorWorkRepository.findById(id);
        if (!work) {
            throw new NotFoundException(
                this.i18n.translate('subcontractorWork.errors.notFound', { lang: this.getLang() }),
            );
        }

        // ✅ تحقق إن الـ work مش محذوف أصلاً
        if (!work.isActive) {
            throw new BadRequestException(
                this.i18n.translate('subcontractorWork.errors.alreadyDeleted', { lang: this.getLang() }),
            );
        }

        const projectId = (work.project as any)?._id?.toString() ?? work.project.toString();

        await this.subcontractorWorkRepository.deactivate(id, user._id as Types.ObjectId);

        await this.updateProjectSubcontractorCosts(projectId);

        return work;
    }

    // ✅ Search — بنمرر projectId للريبو فعلياً
    async searchWorks(projectId: string, searchTerm: string): Promise<TSubcontractorWork[]> {
        this.validateObjectId(projectId, 'projects.errors.invalidId');
        return this.subcontractorWorkRepository.searchWorks(searchTerm, projectId);
    }

    // ✅ Update Project Subcontractor Costs
    private async updateProjectSubcontractorCosts(
        projectId: string | Types.ObjectId,
    ): Promise<void> {
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