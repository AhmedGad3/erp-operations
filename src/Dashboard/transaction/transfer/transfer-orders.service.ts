import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { MaterialIssue, MaterialIssueDocument } from '../../../DB/Models/Transaction/project/material-issue.schema';
import { ProjectInvoice, ProjectInvoiceDocument, ProjectInvoiceStatus } from '../../../DB/Models/Transaction/project/project-invoice.schema';
import { Project, TProject } from '../../../DB/Models/Project/project.schema';
import { StockMovementType } from '../../../DB/Models/Transaction/stock-movement.schema';
import { MaterialRepository, TUser } from '../../../DB';
import { CreateMaterialIssueDto } from './dto/create-material-issue.dto';
import { StockMovementService } from '../stock/stock-movement.service';
import { ClientLedgerService } from '../ledger/Client/client-ledger.service';
import { CounterService } from '../common/counter.service';
import { log } from 'console';

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

    async createMaterialIssue(dto: CreateMaterialIssueDto, user: TUser) {
  const lang = this.getLang();

  // 1️⃣ Validate project
  const project = await this.projectModel.findById(dto.projectId);
  if (!project || !project.isActive) {
    throw new NotFoundException(
      this.i18n.translate('project.errors.notFound', { lang }),
    );
  }

  const processedItems: Array<{
    materialId: Types.ObjectId;
    unitId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  let totalCost = 0;
  let totalPrice = 0;

  // 2️⃣ Process items
  for (const item of dto.items) {
    const material = await this.materialRepository.findById(item.materialId);
    if (!material || !material.isActive) {
      throw new NotFoundException(
        this.i18n.translate('materials.errors.notFound', { lang }),
      );
    }

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
      conversionFactor = altUnit.conversionFactor;
    }

    const quantityInBaseUnit = item.quantity * conversionFactor;

    if (material.currentStock < quantityInBaseUnit) {
      throw new BadRequestException(
        this.i18n.translate('materials.errors.insufficientStock', {
          lang,
          args: {
            material: material.nameAr,
            available: material.currentStock,
            requested: quantityInBaseUnit,
          },
        }),
      );
    }

    if (
      material.lastPurchasePrice != null &&
      item.unitPrice < material.lastPurchasePrice
    ) {
      throw new BadRequestException(
        this.i18n.translate('materials.errors.invalidPrice', {
          lang,
          args: {
            material: material.nameAr,
            min: material.lastPurchasePrice,
            entered: item.unitPrice,
          },
        }),
      );
    }

    const itemCost = quantityInBaseUnit * item.unitPrice;
    totalCost += itemCost;

    const itemTotalPrice = item.quantity * item.unitPrice;
    totalPrice += itemTotalPrice;

    processedItems.push({
      materialId: new Types.ObjectId(item.materialId),
      unitId: new Types.ObjectId(item.unitId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: itemTotalPrice,
    });
  }

  // 3️⃣ Create Material Issue
  const issueNo = await this.counterService.getNext('material-issue');

  const materialIssue = await this.materialIssueModel.create({
    issueNo,
    projectId: new Types.ObjectId(dto.projectId),
    clientId: new Types.ObjectId(project.clientId),
    issueDate: new Date(dto.issueDate),
    items: processedItems,
    totalCost,
    totalPrice,
    notes: dto.notes,
    createdBy: user._id as Types.ObjectId,
  });

  // 4️⃣ Update project costs
  project.materialCosts += totalCost;
  project.totalInvoiced += totalPrice; // ✅ إضافة: تحديث إجمالي فواتير المواد
  project.totalCosts =
    project.materialCosts +
    project.laborCosts +
    project.equipmentCosts +
    project.otherCosts;

  await project.save();

  // 5️⃣ Stock movements
  for (const item of processedItems) {
    await this.stockMovementService.create({
      materialId: item.materialId,
      unitId: item.unitId,
      type: StockMovementType.PROJECT_ISSUE,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      referenceType: 'MaterialIssue',
      referenceId: materialIssue._id as Types.ObjectId,
      projectId: new Types.ObjectId(dto.projectId),
      createdBy: user._id as Types.ObjectId,
    });
  }

  // ❌ مفيش Ledger
  // ❌ مفيش Project Invoice
  // ❌ مفيش Debit على العميل

  return {
    materialIssue,
  };
}


    async findAll() {
        return this.materialIssueModel
            .find()
            .sort({ issueDate: -1 })
            .populate('projectId', 'nameAr nameEn code')
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
            .find({ projectId })
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