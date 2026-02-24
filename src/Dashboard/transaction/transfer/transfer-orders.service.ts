import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { MaterialIssue, MaterialIssueDocument } from '../../../DB/Models/Transaction/project/material-issue.schema';
import { ProjectInvoice, ProjectInvoiceDocument } from '../../../DB/Models/Transaction/project/project-invoice.schema';
import { Project, ProjectStatus, TProject } from '../../../DB/Models/Project/project.schema';
import { StockMovementType } from '../../../DB/Models/Transaction/stock-movement.schema';
import { MaterialRepository, TUser } from '../../../DB';
import { CreateMaterialIssueDto } from './dto/create-material-issue.dto';
import { StockMovementService } from '../stock/stock-movement.service';
import { ClientLedgerService } from '../ledger/Client/client-ledger.service';
import { CounterService } from '../common/counter.service';

@Injectable()
export class MaterialIssueService {
    constructor(
        @InjectModel(MaterialIssue.name)
        private readonly materialIssueModel: Model<MaterialIssueDocument>,

        @InjectModel(ProjectInvoice.name)
        private readonly projectInvoiceModel: Model<ProjectInvoiceDocument>,

        @InjectModel(Project.name)
        private readonly projectModel: Model<TProject>,

        private readonly materialRepository: MaterialRepository,
       
        private readonly stockMovementService: StockMovementService,
        private readonly clientLedgerService: ClientLedgerService,
        private readonly counterService: CounterService,
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

async createMaterialIssue(dto: CreateMaterialIssueDto, user: TUser) {
    const lang = this.getLang();

    // 1️⃣ Validate project
    const project = await this.projectModel.findById(dto.projectId);
    if (!project || !project.isActive) {
        throw new NotFoundException(
            this.i18n.translate('projects.errors.notFound', { lang }),
        );
    }

    if (this.isProjectLocked(project.status)) {
        throw new BadRequestException(
            this.i18n.translate('projects.errors.projectLocked', { lang }),
        );
    }

    const processedItems: Array<{
        materialId: Types.ObjectId;
        unitId: Types.ObjectId;
        quantity: number;
        quantityInBase: number;
        conversionFactor: number;
        lastPurchasePrice: number;
        unitPrice: number;
        discountPercent: number;
        discountAmount: number;
        totalPrice: number;
        totalCost: number;
    }> = [];

    let grandTotalPrice = 0;
    let grandTotalCost  = 0;

    // 2️⃣ Process items
    for (const item of dto.items) {
        const material = await this.materialRepository.findById(item.materialId);
        if (!material || !material.isActive) {
            throw new NotFoundException(
                this.i18n.translate('materials.errors.notFound', { lang }),
            );
        }

        // ── Conversion factor ──
        let conversionFactor = 1;
        if (item.unitId.toString() !== material.baseUnit.toString()) {
            const altUnit = material.alternativeUnits?.find(
                u => u.unitId.toString() === item.unitId.toString(),
            );
            if (!altUnit) {
                throw new BadRequestException(
                    this.i18n.translate('materials.errors.invalidUnit', {
                        lang,
                        args: { material: material.nameAr },
                    }),
                );
            }
            // لو المستخدم بعت conversionFactor استخدمه، لو لأ جيب الافتراضي
            conversionFactor = item.conversionFactor ?? altUnit.conversionFactor;
        }

        // ── Stock validation ──
        const quantityInBase = item.quantity * conversionFactor;
        if (material.currentStock < quantityInBase) {
            throw new BadRequestException(
                this.i18n.translate('materials.errors.insufficientStock', {
                    lang,
                    args: {
                        material: material.nameAr,
                        available: material.currentStock,
                        requested: quantityInBase,
                    },
                }),
            );
        }

        // ── Discount calculation ──
        const lastPurchasePrice = material.lastPurchasePrice ?? 0;
        const discountAmount    = lastPurchasePrice - item.unitPrice;
        const discountPercent   = lastPurchasePrice > 0
            ? (discountAmount / lastPurchasePrice) * 100
            : 0;

        // ── Item totals ──
        const totalPrice = item.quantity * item.unitPrice;
        const totalCost  = item.quantity * lastPurchasePrice;

        grandTotalPrice += totalPrice;
        grandTotalCost  += totalCost;

        processedItems.push({
            materialId:      new Types.ObjectId(item.materialId),
            unitId:          new Types.ObjectId(item.unitId),
            quantity:        item.quantity,
            quantityInBase,
            conversionFactor,
            lastPurchasePrice: lastPurchasePrice,
            unitPrice:       item.unitPrice,
            discountPercent: Math.round(discountPercent * 100) / 100,
            discountAmount:  Math.round(discountAmount  * 100) / 100,
            totalPrice,
            totalCost,
        });
    }

    const totalDiscount = grandTotalCost - grandTotalPrice;

    // 3️⃣ Create Material Issue
    const issueNo = await this.counterService.getNext('material-issue');

    const materialIssue = await this.materialIssueModel.create({
        issueNo,
        projectId:  new Types.ObjectId(dto.projectId),
        clientId:   new Types.ObjectId(project.clientId),
        issueDate:  new Date(dto.issueDate),
        items:      processedItems,
        totalPrice:    grandTotalPrice,
        totalCost:     grandTotalCost,
        totalDiscount,
        notes:      dto.notes,
        createdBy:  user._id as Types.ObjectId,
    });

    // 4️⃣ Update project costs
    project.materialCosts += grandTotalPrice;
    project.totalCosts =
        project.materialCosts  +
        project.laborCosts     +
        project.equipmentCosts +
        project.otherCosts;

    if (project.status === ProjectStatus.PLANNED) {
        project.status = ProjectStatus.IN_PROGRESS;
    }

    await project.save();

    // 5️⃣ Stock movements — بالـ quantityInBase
    for (const item of processedItems) {
        await this.stockMovementService.create({
            materialId:    item.materialId,
            unitId:        item.unitId,
            type:          StockMovementType.PROJECT_ISSUE,
            quantity:      item.quantity,
            quantityInBase: item.quantityInBase,  // ← المهم هنا
            unitPrice:     item.unitPrice,
            referenceType: 'MaterialIssue',
            referenceId:   materialIssue._id as Types.ObjectId,
            projectId:     new Types.ObjectId(dto.projectId),
            createdBy:     user._id as Types.ObjectId,
        });
    }

    return { materialIssue };
}

    async findAll() {
        return this.materialIssueModel
            .find()
            .sort({ issueDate: -1 })
            .populate('projectId', 'nameAr nameEn code ')
            .populate('clientId', 'nameAr nameEn')
            .populate('items.materialId', 'nameAr nameEn code')
            .populate('createdBy', 'name')
            .exec();
    }

    async findById(id: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('materialIssue.errors.invalidId', { lang }),
            );
        }

        const materialIssue = await this.materialIssueModel
            .findById(id)
            .populate('projectId', 'nameAr nameEn code')
            .populate('clientId', 'nameAr nameEn')
            .populate('items.materialId', 'nameAr nameEn code')
            .populate('items.unitId', 'nameAr nameEn symbol')
            .populate('createdBy', 'name')
            .exec();

        if (!materialIssue) {
            throw new NotFoundException(
                this.i18n.translate('materialIssue.errors.notFound', { lang }),
            );
        }

        return materialIssue;
    }

    async findByProject(projectId: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('project.errors.invalidId', { lang }),
            );
        }

        return this.materialIssueModel
            .find({  projectId: new Types.ObjectId(projectId)  })
            .sort({ issueDate: -1 })
            .populate('items.materialId', 'nameAr nameEn code')
            .populate('items.unitId', 'nameAr nameEn symbol')
            .populate('createdBy', 'name')
            .exec();
    }

    async findByClient(clientId: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(clientId)) {
            throw new BadRequestException(
                this.i18n.translate('client.errors.invalidId', { lang }),
            );
        }

        return this.materialIssueModel
            .find({ clientId })
            .sort({ issueDate: -1 })
            .populate('projectId', 'nameAr nameEn code')
            .populate('items.materialId', 'nameAr nameEn code')
            .populate('items.unitId', 'nameAr nameEn symbol')
            .exec();
    }
}