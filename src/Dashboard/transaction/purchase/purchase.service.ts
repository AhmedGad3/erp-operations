import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { TUser, MaterialRepository } from '../../../DB';
import {
  PurchaseInvoice,
  PurchaseInvoiceStatus,
} from '../../../DB/Models/Transaction/supplier/purchase-invoice.schema';
import {
  PurchaseReturn,
  PurchaseReturnDocument,
} from '../../../DB/Models/Transaction/supplier/purchase-return.schema';
import { StockMovementType } from '../../../DB/Models/Transaction/stock-movement.schema';
import { CounterService } from '../common/counter.service';
import { SupplierLedgerService } from '../ledger/Supplier/supplier-ledger.service';
import { StockMovementService } from '../stock/stock-movement.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(PurchaseInvoice.name)
    private readonly purchaseModel: Model<PurchaseInvoice>,

    @InjectModel(PurchaseReturn.name)
    private readonly purchaseReturnModel: Model<PurchaseReturnDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    private readonly ledgerService: SupplierLedgerService,
    private readonly stockMovementService: StockMovementService,
    private readonly materialRepository: MaterialRepository,
    private readonly counterService: CounterService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(): string {
    return I18nContext.current()?.lang || 'ar';
  }

  private async allocateReturnToInvoices(
    supplierId: Types.ObjectId,
    amount: number,
    session?: ClientSession,
  ) {
    let remaining = amount;

    const openInvoices = await this.purchaseModel
      .find({
        supplierId,
        status: {
          $in: [PurchaseInvoiceStatus.OPEN, PurchaseInvoiceStatus.PARTIAL],
        },
      })
      .session(session || null)
      .sort({ invoiceDate: 1 });

    for (const invoice of openInvoices) {
      if (remaining <= 0) break;

      const allocated = Math.min(invoice.remainingAmount, remaining);

      invoice.paidAmount += allocated;
      invoice.remainingAmount -= allocated;
      invoice.status =
        invoice.remainingAmount === 0
          ? PurchaseInvoiceStatus.PAID
          : PurchaseInvoiceStatus.PARTIAL;

      await invoice.save(session ? { session } : undefined);
      remaining -= allocated;
    }
  }

  async createPurchase(dto: CreatePurchaseDto, user: TUser) {
    const lang = this.getLang();

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    if (totalAmount <= 0) {
      throw new BadRequestException(
        this.i18n.translate('purchases.errors.invalidTotal', { lang }),
      );
    }

    const processedItems = await Promise.all(
      dto.items.map(async (item) => {
        const material = await this.materialRepository.findActiveById(
          item.materialId.toString(),
        );
        if (!material) {
          throw new NotFoundException(
            this.i18n.translate('materials.errors.notFound', { lang }),
          );
        }

        const baseUnitId = material.baseUnit.toString();
        const unitId = item.unitId.toString();
        let conversionFactor = 1;

        if (unitId !== baseUnitId) {
          const altUnit = material.alternativeUnits?.find(
            (unit) => unit.unitId.toString() === unitId,
          );
          if (!altUnit) {
            throw new BadRequestException(
              this.i18n.translate('purchases.errors.invalidUnit', { lang }),
            );
          }
          conversionFactor = item.conversionFactor ?? altUnit.conversionFactor;
        }

        const quantityInBase = item.quantity * conversionFactor;
        return { item, conversionFactor, quantityInBase };
      }),
    );

    const session = await this.connection.startSession();

    try {
      let createdInvoice: PurchaseInvoice | null = null;

      await session.withTransaction(async () => {
        const invoiceNo = await this.counterService.getNext(
          'purchase-invoice',
          session,
        );

        const invoiceDate = new Date(dto.invoiceDate);
        let dueDate: Date | undefined;

        if (dto.creditDays && dto.creditDays > 0) {
          dueDate = new Date(invoiceDate);
          dueDate.setDate(dueDate.getDate() + dto.creditDays);
        }

        const invoice = new this.purchaseModel({
          invoiceNo,
          supplierId: dto.supplierId,
          supplierInvoiceNo: dto.supplierInvoiceNo,
          invoiceDate,
          dueDate,
          items: processedItems.map(({ item, conversionFactor, quantityInBase }) => ({
            materialId: item.materialId,
            unitId: item.unitId,
            quantity: item.quantity,
            quantityInBase,
            conversionFactor,
            unitPrice: item.unitPrice,
            lastPurchasePrice: item.unitPrice,
            lastPurchaseDate: new Date(),
            total: item.quantity * item.unitPrice,
          })),
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          status: PurchaseInvoiceStatus.OPEN,
          notes: dto.notes,
          createdBy: user._id,
        });

        await invoice.save({ session });

        for (const { item, quantityInBase } of processedItems) {
          await this.stockMovementService.create(
            {
              materialId: new Types.ObjectId(item.materialId),
              unitId: new Types.ObjectId(item.unitId),
              type: StockMovementType.IN,
              quantity: quantityInBase,
              unitPrice: item.unitPrice,
              lastPurchasePrice: item.unitPrice,
              lastPurchaseDate: new Date(),
              referenceType: 'PurchaseInvoice',
              referenceId: invoice._id,
              createdBy: user._id as Types.ObjectId,
            },
            session,
          );
        }

        await this.ledgerService.createTransaction(
          {
            supplierId: dto.supplierId,
            debit: totalAmount,
            credit: 0,
            type: 'purchase',
            referenceType: 'PurchaseInvoice',
            referenceId: invoice._id,
            createdBy: user._id as Types.ObjectId,
          },
          session,
        );

        createdInvoice = invoice;
      });

      if (!createdInvoice) {
        throw new BadRequestException('Failed to create purchase invoice');
      }

      return createdInvoice;
    } finally {
      await session.endSession();
    }
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      const lang = this.getLang();
      throw new BadRequestException(
        this.i18n.translate('purchases.errors.invalidId', { lang }),
      );
    }

    const invoice = await this.purchaseModel
      .findById(id)
      .populate('supplierId', 'nameAr nameEn code -_id')
      .populate('items.materialId', 'nameAr nameEn code ')
      .populate('createdBy', 'name email');

    if (!invoice) {
      const lang = this.getLang();
      throw new NotFoundException(
        this.i18n.translate('purchases.errors.notFound', { lang }),
      );
    }

    return invoice;
  }

  async findAll() {
    return this.purchaseModel
      .find()
      .sort({ invoiceDate: -1 })
      .populate('supplierId', 'nameAr nameEn code')
      .populate('createdBy', 'name');
  }

  async findBySupplier(supplierId: string) {
    if (!Types.ObjectId.isValid(supplierId)) {
      const lang = this.getLang();
      throw new BadRequestException(
        this.i18n.translate('purchases.errors.invalidId', { lang }),
      );
    }

    const result = await this.purchaseModel
      .find({ supplierId })
      .sort({ invoiceDate: -1 })
      .populate('createdBy', 'name');

    if (result.length === 0) {
      const lang = this.getLang();
      throw new NotFoundException(
        this.i18n.translate('purchases.errors.noPurchasesFound', { lang }),
      );
    }

    return result;
  }

  async getOpenInvoices(supplierId: string) {
    if (!Types.ObjectId.isValid(supplierId)) {
      const lang = this.getLang();
      throw new BadRequestException(
        this.i18n.translate('purchases.errors.invalidId', { lang }),
      );
    }

    const result = await this.purchaseModel
      .find({
        supplierId,
        status: {
          $in: [PurchaseInvoiceStatus.OPEN, PurchaseInvoiceStatus.PARTIAL],
        },
      })
      .sort({ invoiceDate: 1 });

    if (result.length === 0) {
      const lang = this.getLang();
      throw new NotFoundException(
        this.i18n.translate('purchases.errors.noOpenInvoices', { lang }),
      );
    }

    return result;
  }

  async createPurchaseReturn(dto: CreatePurchaseReturnDto, user: TUser) {
    const lang = this.getLang();

    const processedItems = await Promise.all(
      dto.items.map(async (item) => {
        const material = await this.materialRepository.findActiveById(
          item.materialId.toString(),
        );

        if (!material) {
          throw new NotFoundException(
            this.i18n.translate('materials.errors.notFound', { lang }),
          );
        }

        const baseUnitId = material.baseUnit.toString();
        const unitId = item.unitId.toString();
        let conversionFactor = 1;

        if (unitId !== baseUnitId) {
          const altUnit = material.alternativeUnits?.find(
            (unit) => unit.unitId.toString() === unitId,
          );
          if (!altUnit) {
            throw new BadRequestException(
              this.i18n.translate('purchases.errors.invalidUnit', { lang }),
            );
          }
          conversionFactor = item.conversionFactor ?? altUnit.conversionFactor;
        }

        const quantityInBase = item.quantity * conversionFactor;

        if (material.currentStock < quantityInBase) {
          throw new BadRequestException(
            this.i18n.translate('purchases.errors.insufficientStock', {
              lang,
              args: {
                material: material.nameAr,
                available: material.currentStock,
                requested: quantityInBase,
              },
            }),
          );
        }

        return { item, conversionFactor, quantityInBase };
      }),
    );

    const totalAmount = processedItems.reduce(
      (sum, { item }) => sum + item.quantity * item.unitPrice,
      0,
    );

    const session = await this.connection.startSession();

    try {
      let createdReturn: PurchaseReturnDocument | null = null;

      await session.withTransaction(async () => {
        const returnNo = await this.counterService.getNext(
          'purchase-return',
          session,
        );

        const purchaseReturn = new this.purchaseReturnModel({
          returnNo,
          supplierId: dto.supplierId,
          returnDate: dto.returnDate,
          items: processedItems.map(({ item, conversionFactor, quantityInBase }) => ({
            materialId: item.materialId,
            unitId: item.unitId,
            quantity: item.quantity,
            quantityInBase,
            conversionFactor,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
          totalAmount,
          notes: dto.notes,
          createdBy: user._id,
        });

        await purchaseReturn.save({ session });

        await this.allocateReturnToInvoices(
          dto.supplierId,
          totalAmount,
          session,
        );

        await this.ledgerService.createTransaction(
          {
            supplierId: dto.supplierId,
            debit: 0,
            credit: totalAmount,
            type: 'return',
            referenceType: 'PurchaseReturn',
            referenceId: purchaseReturn._id,
            createdBy: user._id as Types.ObjectId,
          },
          session,
        );

        for (const { item, quantityInBase } of processedItems) {
          await this.stockMovementService.create(
            {
              materialId: new Types.ObjectId(item.materialId),
              unitId: new Types.ObjectId(item.unitId),
              type: StockMovementType.RETURN_OUT,
              quantity: quantityInBase,
              unitPrice: item.unitPrice,
              referenceType: 'PurchaseReturn',
              referenceId: purchaseReturn._id,
              createdBy: user._id as Types.ObjectId,
            },
            session,
          );
        }

        createdReturn = purchaseReturn;
      });

      if (!createdReturn) {
        throw new BadRequestException('Failed to create purchase return');
      }

      return createdReturn;
    } finally {
      await session.endSession();
    }
  }

  async findAllReturns() {
    return this.purchaseReturnModel
      .find()
      .sort({ returnNo: -1 })
      .populate('supplierId', 'nameAr nameEn code')
      .populate('createdBy', 'name email')
      .populate('items.materialId', 'nameAr nameEn code')
      .populate('items.unitId', 'nameAr nameEn symbol')
      .exec();
  }
}
