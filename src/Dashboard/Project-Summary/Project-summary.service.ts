import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { Project, TProject } from '../../DB/Models/Project/project.schema';
import { MaterialIssue, MaterialIssueDocument } from '../../DB/Models/Transaction/project/material-issue.schema';
import { ProjectLabor, TProjectLabor } from 'src/DB/Models/ProjectLabor/project-labor.schema';
import { ProjectEquipment, TProjectEquipment } from 'src/DB/Models/Project-Equipment/project-equipment.schema';
import { ProjectMiscellaneous, TProjectMiscellaneous } from 'src/DB/Models/project-miscellaneous/project-miscellaneous.schema';
import { SubcontractorWork, TSubcontractorWork } from 'src/DB/Models/Subcontractor-Work/subcontractor-work.schema';
import { ProjectSummaryQueryDto } from './dto/Project-summary-query.dto';


@Injectable()
export class ProjectSummaryService {
    constructor(
        @InjectModel(Project.name)
        private readonly projectModel: Model<TProject>,

        @InjectModel(ProjectLabor.name)
        private readonly laborModel: Model<TProjectLabor>,

        @InjectModel(ProjectEquipment.name)
        private readonly equipmentModel: Model<TProjectEquipment>,

        @InjectModel(ProjectMiscellaneous.name)
        private readonly miscModel: Model<TProjectMiscellaneous>,

        @InjectModel(SubcontractorWork.name)
        private readonly subcontractorModel: Model<TSubcontractorWork>,

        @InjectModel(MaterialIssue.name)
        private readonly materialIssueModel: Model<MaterialIssueDocument>,

        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    async getProjectSummary(query: ProjectSummaryQueryDto) {
        const { projectId, dateFrom, dateTo } = query;

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang: this.getLang() }),
            );
        }

        // ✅ جيب المشروع مع الـ virtuals
        const project = await this.projectModel
            .findById(projectId)
            .populate('clientId', 'nameAr nameEn phone email')
            .exec();

        if (!project || !project.isActive) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang: this.getLang() }),
            );
        }

        const proj = project.toObject({ virtuals: true }) as TProject;

        // ✅ بناء الـ date filter للـ lists لو موجود
        const dateFilter = this.buildDateFilter(dateFrom, dateTo);
        const objectId = new Types.ObjectId(projectId);

        // ✅ جيب كل الـ lists بالتوازي
        const [
            laborList,
            equipmentList,
            miscList,
            subcontractorList,
            materialIssueList,
        ] = await Promise.all([
            this.getLaborList(objectId, dateFilter),
            this.getEquipmentList(objectId, dateFilter),
            this.getMiscList(objectId, dateFilter),
            this.getSubcontractorList(objectId, dateFilter),
            this.getMaterialIssueList(objectId, dateFilter),
        ]);

        return {
            // ========== بيانات المشروع ==========
            projectInfo: {
                _id: proj._id,
                nameAr: proj.nameAr,
                nameEn: proj.nameEn,
                code: proj.code,
                client: proj.clientId,
                projectManager: proj.projectManager,
                siteEngineer: proj.siteEngineer,
                location: proj.location,
                startDate: proj.startDate,
                expectedEndDate: proj.expectedEndDate,
                actualEndDate: proj.actualEndDate,
                status: proj.status,
                notes: proj.notes,
            },

            // ========== الملخص المالي ==========
            financialSummary: {
                contractAmount: proj.contractAmount,
                totalPaid: proj.totalPaid,
                contractRemaining: proj.contractRemaining,
                totalInvoiced: proj.totalInvoiced,
                totalCosts: proj.totalCosts,
                expectedProfit: proj.expectedProfit,
                realizedProfit: proj.realizedProfit,
                completionPercentage: proj.completionPercentage,
                profitMargin: proj.profitMargin,
                realizedProfitMargin: proj.realizedProfitMargin,
            },

            // ========== تفاصيل التكاليف ==========
            costBreakdown: {
                materialCosts: proj.materialCosts,
                laborCosts: proj.laborCosts,
                equipmentCosts: proj.equipmentCosts,
                subcontractorCosts: proj.subcontractorCosts,
                otherCosts: proj.otherCosts,
                totalCosts: proj.totalCosts,
            },

            // ========== الفلتر المستخدم ==========
            appliedFilters: {
                dateFrom: dateFrom || null,
                dateTo: dateTo || null,
            },

            // ========== اللوائح التفصيلية ==========
            labor: {
                total: laborList.reduce((sum, l) => sum + l.totalCost, 0),
                count: laborList.length,
                items: laborList,
            },

            equipment: {
                total: equipmentList.reduce((sum, e) => sum + e.totalCost, 0),
                count: equipmentList.length,
                items: equipmentList,
            },

            miscellaneous: {
                total: miscList.reduce((sum, m) => sum + m.amount, 0),
                count: miscList.length,
                items: miscList,
            },

            subcontractors: {
                total: subcontractorList.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
                count: subcontractorList.length,
                items: subcontractorList,
            },

            materialIssues: {
                totalCost: materialIssueList.reduce((sum, i) => sum + i.totalCost, 0),
                totalPrice: materialIssueList.reduce((sum, i) => sum + i.totalPrice, 0),
                totalDiscount: materialIssueList.reduce((sum, i) => sum + i.totalDiscount, 0),
                count: materialIssueList.length,
                items: materialIssueList,
            },
        };
    }

    // ========================================================
    // Helpers
    // ========================================================

    private buildDateFilter(dateFrom?: string, dateTo?: string): Record<string, any> | null {
        if (!dateFrom && !dateTo) return null;

        const filter: Record<string, any> = {};
        if (dateFrom) filter.$gte = new Date(dateFrom);
        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            filter.$lte = end;
        }
        return filter;
    }

    private async getLaborList(projectId: Types.ObjectId, dateFilter: Record<string, any> | null) {
        const query: any = { projectId };
        if (dateFilter) query.startDate = dateFilter;

        return this.laborModel
            .find(query)
            .populate('createdBy', 'name')
            .sort({ startDate: -1 })
            .lean()
            .exec();
    }

    private async getEquipmentList(projectId: Types.ObjectId, dateFilter: Record<string, any> | null) {
        const query: any = { projectId, isActive: true };
        if (dateFilter) query.startDate = dateFilter;

        return this.equipmentModel
            .find(query)
            .populate('assetId', 'nameAr nameEn code')
            .populate('createdBy', 'name')
            .sort({ startDate: -1 })
            .lean()
            .exec();
    }

    private async getMiscList(projectId: Types.ObjectId, dateFilter: Record<string, any> | null) {
        const query: any = { projectId };
        if (dateFilter) query.date = dateFilter;

        return this.miscModel
            .find(query)
            .populate('createdBy', 'name')
            .sort({ date: -1 })
            .lean()
            .exec();
    }

    private async getSubcontractorList(projectId: Types.ObjectId, dateFilter: Record<string, any> | null) {
        const query: any = { projectId, isActive: true };
        if (dateFilter) query.workDate = dateFilter;

        return this.subcontractorModel
            .find(query)
            .populate('createdBy', 'name')
            .sort({ workDate: -1 })
            .lean()
            .exec();
    }

    private async getMaterialIssueList(projectId: Types.ObjectId, dateFilter: Record<string, any> | null) {
        const query: any = { projectId };
        if (dateFilter) query.issueDate = dateFilter;

        return this.materialIssueModel
            .find(query)
            .populate('items.materialId', 'nameAr nameEn code')
            .populate('items.unitId', 'nameAr nameEn symbol')
            .populate('createdBy', 'name')
            .sort({ issueDate: -1 })
            .lean()
            .exec();
    }
}