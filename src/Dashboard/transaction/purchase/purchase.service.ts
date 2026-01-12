import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PurchaseInvoice, PurchaseInvoiceStatus } from '../../../DB/Models/Transaction/supplier/purchase-invoice.schema';
import { SupplierLedgerService } from '../ledger/Supplier/supplier-ledger.service';
import { CounterService } from '../common/counter.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { StockMovementType } from '../../../DB/Models/Transaction/stock-movement.schema';
import { TUser, MaterialRepository } from '../../../DB';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { PurchaseReturn, PurchaseReturnDocument } from '../../../DB/Models/Transaction/supplier/purchase-return.schema';
import { StockMovementService } from '../stock/stock-movement.service';

@Injectable()
export class PurchaseService {
    constructor(
        @InjectModel(PurchaseInvoice.name)
        private readonly purchaseModel: Model<PurchaseInvoice>,

        @InjectModel(PurchaseReturn.name)
        private readonly purchaseReturnModel: Model<PurchaseReturnDocument>,

        private readonly ledgerService: SupplierLedgerService,
        private readonly stockMovementService: StockMovementService,
        private readonly materialRepository: MaterialRepository,
        private readonly counterService: CounterService,
        private readonly i18n: I18nService,
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }
    // ===============================
    // Allocate Return to Invoices
    // ===============================
    private async allocateReturnToInvoices(
        supplierId: Types.ObjectId,
        amount: number,
    ) {
        let remaining = amount;

        const openInvoices = await this.purchaseModel
            .find({
                supplierId,
                status: {
                    $in: [
                        PurchaseInvoiceStatus.OPEN,
                        PurchaseInvoiceStatus.PARTIAL,
                    ],
                },
            })
            .sort({ invoiceDate: 1 }); // FIFO

        for (const invoice of openInvoices) {
            if (remaining <= 0) break;

            const allocated = Math.min(invoice.remainingAmount, remaining);

            invoice.paidAmount += allocated;
            invoice.remainingAmount -= allocated;

            invoice.status =
                invoice.remainingAmount === 0
                    ? PurchaseInvoiceStatus.PAID
                    : PurchaseInvoiceStatus.PARTIAL;

            await invoice.save();
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
            this.i18n.translate('purchase.errors.invalidTotal', { lang }),
        );
    }

    const invoiceNo = await this.counterService.getNext('purchase-invoice');

    const invoiceDate = new Date(dto.invoiceDate);
    let dueDate: Date | undefined;

    if (dto.creditDays && dto.creditDays > 0) {
        dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + dto.creditDays);
    }

    const invoice = await this.purchaseModel.create({
        invoiceNo,
        supplierId: dto.supplierId,
        supplierInvoiceNo: dto.supplierInvoiceNo,
        invoiceDate,
        dueDate,
        items: dto.items.map(item => ({
            materialId: item.materialId ,
            unitId: item.unitId, // ✅
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lastPurchasePrice: item.unitPrice ,   
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

    // ✅ Stock IN
    for (const item of dto.items) {
        await this.stockMovementService.create({
            materialId: new Types.ObjectId(item.materialId)  ,
            unitId:  new Types.ObjectId(item.unitId), // ✅
            type: StockMovementType.IN,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lastPurchasePrice: item.unitPrice,
            lastPurchaseDate: new Date(),
            referenceType: 'PurchaseInvoice',
            referenceId: invoice._id,
            createdBy: user._id as Types.ObjectId,
        });
    }

    // ✅ Ledger (DEBIT)
    await this.ledgerService.createTransaction({
        supplierId: dto.supplierId,
        debit: totalAmount,
        credit: 0,
        type: 'purchase',
        referenceType: 'PurchaseInvoice',
        referenceId: invoice._id,
        createdBy: user._id as Types.ObjectId,
    });

    return invoice;
}
    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            const lang = this.getLang();
            throw new BadRequestException(
                this.i18n.translate('purchase.errors.invalidId', { lang })
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
                this.i18n.translate('purchase.errors.notFound', { lang })
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
                this.i18n.translate('purchase.errors.invalidId', { lang })
            );
        }
        const result = await this.purchaseModel
            .find({ supplierId: (supplierId) })
            .sort({ invoiceDate: -1 })
            .populate('createdBy', 'name');

        if (result.length === 0) {
            const lang = this.getLang();
            throw new NotFoundException(
                this.i18n.translate('purchase.errors.noPurchasesFound', { lang })
            );
        }

        return result;
    }

    async getOpenInvoices(supplierId: string) {
        if (!Types.ObjectId.isValid(supplierId)) {
            const lang = this.getLang();
            throw new BadRequestException(
                this.i18n.translate('purchase.errors.invalidId', { lang })
            );
        }
        const result = await this.purchaseModel
            .find({
                supplierId: (supplierId),
                status: { $in: [PurchaseInvoiceStatus.OPEN, PurchaseInvoiceStatus.PARTIAL] },
            })
            .sort({ invoiceDate: 1 });

        if (result.length === 0) {
            const lang = this.getLang();
            throw new NotFoundException(
                this.i18n.translate('purchase.errors.noOpenInvoices', { lang })
            );
        }

        return result;
    }

    // ===============================
    // Create Purchase Return
    // ===============================
    // async createPurchaseReturn(
    //     dto: CreatePurchaseReturnDto,
    //     user: TUser,
    // ) {
    //     const lang = this.getLang();

    //     // ✅ Validate stock availability
    //     for (const item of dto.items) {
    //         const material =
    //             await this.materialRepository.findById(item.materialId);

    //         if (!material) {
    //             throw new NotFoundException(
    //                 this.i18n.translate(
    //                     'materials.errors.notFound',
    //                     { lang },
    //                 ),
    //             );
    //         }

    //         if (material.currentStock < item.quantity) {
    //             throw new BadRequestException(
    //                 this.i18n.translate(
    //                     'purchase.errors.insufficientStock',
    //                     {
    //                         lang,
    //                         args: {
    //                             material: material.nameAr,
    //                             available: material.currentStock,
    //                             requested: item.quantity,
    //                         },
    //                     },
    //                 ),
    //             );
    //         }
    //     }

    //     const items = dto.items.map(i => ({
    //         ...i,
    //         total: i.quantity * i.unitPrice,
    //     }));

    //     const totalAmount = items.reduce(
    //         (sum, item) => sum + item.total,
    //         0,
    //     );

    //     const returnNo =
    //         await this.counterService.getNext('purchase-return');

    //     const purchaseReturn =
    //         await this.purchaseReturnModel.create({
    //             returnNo,
    //             supplierId: dto.supplierId,
    //             returnDate: dto.returnDate,
    //             items,
    //             totalAmount,
    //             notes: dto.notes,
    //             createdBy: user._id,
    //         });

    //     // 🔥 1️⃣ Allocate return to invoices (FIRST)
    //     await this.allocateReturnToInvoices(
    //         dto.supplierId,
    //         totalAmount,
    //     );

    //     // 🔥 2️⃣ Ledger (CREDIT)
    //     await this.ledgerService.createTransaction({
    //         supplierId: dto.supplierId,
    //         debit: 0,
    //         credit: totalAmount,
    //         type: 'return',
    //         referenceType: 'PurchaseReturn',
    //         referenceId: purchaseReturn._id,
    //         createdBy: user._id as Types.ObjectId,
    //     });

    //     // 🔥 3️⃣ Stock OUT
    //     for (const item of items) {
    //         await this.stockMovementService.create({
    //             materialId: item.materialId,
    //             type: StockMovementType.RETURN_OUT,
    //             quantity: item.quantity,
    //             unitPrice: item.unitPrice,
    //             referenceType: 'PurchaseReturn',
    //             referenceId: purchaseReturn._id,
    //             createdBy: user._id as Types.ObjectId,
    //         });
    //     }

    //     return purchaseReturn;
    // }
async createPurchaseReturn(dto: CreatePurchaseReturnDto, user: TUser) {
    const lang = this.getLang();

    // ✅ Validate stock availability
    for (const item of dto.items) {
        const material = await this.materialRepository.findById(item.materialId);

        if (!material) {
            throw new NotFoundException(
                this.i18n.translate('materials.errors.notFound', { lang }),
            );
        }

        // 🧮 Convert to base unit for validation
        let conversionFactor = 1;
        if (item.unitId.toString() !== material.baseUnit.toString()) {
            const altUnit = material.alternativeUnits?.find(
                u => u.unitId.toString() === item.unitId.toString()
            );
            if (!altUnit) {
                throw new BadRequestException(
                    this.i18n.translate('purchase.errors.invalidUnit', { lang })
                );
            }
            conversionFactor = altUnit.conversionFactor;
        }

        const quantityInBaseUnit = item.quantity * conversionFactor;

        if (material.currentStock < quantityInBaseUnit) {
            throw new BadRequestException(
                this.i18n.translate('purchase.errors.insufficientStock', {
                    lang,
                    args: {
                        material: material.nameAr,
                        available: material.currentStock,
                        requested: quantityInBaseUnit,
                    },
                }),
            );
        }
    }

    const items = dto.items.map(i => ({
        ...i,
        total: i.quantity * i.unitPrice,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const returnNo = await this.counterService.getNext('purchase-return');

    const purchaseReturn = await this.purchaseReturnModel.create({
        returnNo,
        supplierId: dto.supplierId,
        returnDate: dto.returnDate,
        items,
        totalAmount,
        notes: dto.notes,
        createdBy: user._id,
    });

    // 🔥 1️⃣ Allocate return to invoices
    await this.allocateReturnToInvoices(dto.supplierId, totalAmount);

    // 🔥 2️⃣ Ledger (CREDIT)
    await this.ledgerService.createTransaction({
        supplierId: dto.supplierId,
        debit: 0,
        credit: totalAmount,
        type: 'return',
        referenceType: 'PurchaseReturn',
        referenceId: purchaseReturn._id,
        createdBy: user._id as Types.ObjectId,
    });

    // 🔥 3️⃣ Stock OUT
    for (const item of items) {
        await this.stockMovementService.create({
            materialId: item.materialId,
            unitId: item.unitId, // ✅
            type: StockMovementType.RETURN_OUT,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            referenceType: 'PurchaseReturn',
            referenceId: purchaseReturn._id,
            createdBy: user._id as Types.ObjectId,
        });
    }

    return purchaseReturn;
}

}

// import {
//     Injectable,
//     BadRequestException,
//     NotFoundException,
// } from '@nestjs/common';
// import { InjectConnection, InjectModel } from '@nestjs/mongoose';
// import { Connection, Model, Types } from 'mongoose';
// import { PurchaseInvoice, PurchaseInvoiceStatus } from 'src/DB/Models/Transaction/purchase-invoice.schema';
// import { SupplierLedgerService } from '../ledger/supplier-ledger.service';
// import { CounterService } from '../common/counter.service';
// import { CreatePurchaseDto } from './dto/create-purchase.dto';
// import { StockMovement, StockMovementType } from 'src/DB/Models/Transaction/stock-movement.schema';
// import { TUser } from 'src/DB';
// import { I18nContext, I18nService } from 'nestjs-i18n';
// import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
// import { PurchaseReturn, PurchaseReturnDocument } from 'src/DB/Models/Transaction/purchase-return.schema';
// import { StockMovementService } from '../stock/stock-movement.service';

// @Injectable()
// export class PurchaseService {
//     constructor(
//         @InjectModel(PurchaseInvoice.name)
//         private readonly purchaseModel: Model<PurchaseInvoice>,

//         @InjectModel(PurchaseReturn.name)
//         private readonly purchaseReturnModel: Model<PurchaseReturnDocument>,

//         private readonly ledgerService: SupplierLedgerService,
//         private readonly stockMovementService: StockMovementService, // ✅
//         private readonly counterService: CounterService,
//         private readonly i18n: I18nService,
//     ) { }


// /*************  ✨ Windsurf Command ⭐  *************/
// /**
//  * Returns the current language set in the i18n context.
//  * If no language is set, it returns 'ar' as default.
//  * @returns {string} The current language set in the i18n context.
//  */
// /*******  ef4aacde-26b3-40d5-a442-cef215263d72  *******/    private getLang(): string {
//         return I18nContext.current()?.lang || 'ar';
//     }




//     async createPurchase(dto: CreatePurchaseDto, user: TUser) {
//         const lang = this.getLang();

//         const totalAmount = dto.items.reduce(
//             (sum, item) => sum + item.quantity * item.unitPrice,
//             0,
//         );

//         if (totalAmount <= 0) {
//             throw new BadRequestException(
//                 this.i18n.translate('purchase.errors.invalidTotal', { lang }),
//             );
//         }

//         const invoiceNo = await this.counterService.getNext('purchase-invoice');

//         const invoiceDate = new Date(dto.invoiceDate);
//         let dueDate: Date | undefined;

//         if (dto.creditDays && dto.creditDays > 0) {
//             dueDate = new Date(invoiceDate);
//             dueDate.setDate(dueDate.getDate() + dto.creditDays);
//         }

//         const invoice = await this.purchaseModel.create({
//             invoiceNo,
//             supplierId: dto.supplierId,
//             supplierInvoiceNo: dto.supplierInvoiceNo,
//             invoiceDate,
//             dueDate,
//             items: dto.items.map(item => ({
//                 materialId: item.materialId,
//                 quantity: item.quantity,
//                 unitPrice: item.unitPrice,
//                 total: item.quantity * item.unitPrice,
//             })),
//             totalAmount,
//             paidAmount: 0,
//             remainingAmount: totalAmount,
//             status: PurchaseInvoiceStatus.OPEN,
//             notes: dto.notes,
//             createdBy: user._id,
//         });

//         // ✅ Stock IN
//         for (const item of dto.items) {
//             await this.stockMovementService.create({
//                 materialId: item.materialId,
//                 type: StockMovementType.IN,
//                 quantity: item.quantity,
//                 unitPrice: item.unitPrice,
//                 referenceType: 'PurchaseInvoice',
//                 referenceId: invoice._id,
//                 createdBy: user._id as Types.ObjectId,
//             });
//         }

//         // ✅ Ledger (DEBIT)
//         await this.ledgerService.createTransaction({
//             supplierId: dto.supplierId,
//             debit: totalAmount,
//             credit: 0,
//             type: 'purchase',
//             referenceType: 'PurchaseInvoice',
//             referenceId: invoice._id,
//             createdBy: user._id as Types.ObjectId,
//         });

//         return invoice;
//     }


//     async findById(id: string) {
//         if (!Types.ObjectId.isValid(id)) {
//             const lang = this.getLang();
//             throw new BadRequestException(
//                 this.i18n.translate('purchase.errors.invalidId', { lang })
//             );
//         }

//         const invoice = await this.purchaseModel
//             .findById(id)
//             .populate('supplierId', 'nameAr nameEn code -_id')
//             .populate('items.materialId', 'nameAr nameEn code ')
//             .populate('createdBy', 'name email');

//         if (!invoice) {
//             const lang = this.getLang();
//             throw new NotFoundException(
//                 this.i18n.translate('purchase.errors.notFound', { lang })
//             );
//         }

//         return invoice;
//     }

//     async findAll() {
//         return this.purchaseModel
//             .find()
//             .sort({ invoiceDate: -1 })
//             .populate('supplierId', 'nameAr nameEn code')
//             .populate('createdBy', 'name');
//     }

//     async findBySupplier(supplierId: string) {
//         if (!Types.ObjectId.isValid(supplierId)) {
//             const lang = this.getLang();
//             throw new BadRequestException(
//                 this.i18n.translate('purchase.errors.invalidId', { lang })
//             );
//         }
//         const result = await this.purchaseModel
//             .find({ supplierId: (supplierId) })
//             .sort({ invoiceDate: -1 })
//             .populate('createdBy', 'name');

//         if (result.length === 0) {
//             const lang = this.getLang();
//             throw new NotFoundException(
//                 this.i18n.translate('purchase.errors.noPurchasesFound', { lang })
//             );
//         }

//         return result;
//     }

//     async getOpenInvoices(supplierId: string) {
//         if (!Types.ObjectId.isValid(supplierId)) {
//             const lang = this.getLang();
//             throw new BadRequestException(
//                 this.i18n.translate('purchase.errors.invalidId', { lang })
//             );
//         }
//         const result = await this.purchaseModel
//             .find({
//                 supplierId: (supplierId),
//                 status: { $in: [PurchaseInvoiceStatus.OPEN, PurchaseInvoiceStatus.PARTIAL] },
//             })
//             .sort({ invoiceDate: 1 });

//         if (result.length === 0) {
//             const lang = this.getLang();
//             throw new NotFoundException(
//                 this.i18n.translate('purchase.errors.noOpenInvoices', { lang })
//             );
//         }

//         return result;
//     }


//     async createPurchaseReturn(dto: CreatePurchaseReturnDto, user: TUser) {
//         const items = dto.items.map(i => ({
//             ...i,
//             total: i.quantity * i.unitPrice,
//         }));

//         const totalAmount = items.reduce((s, i) => s + i.total, 0);

//         const returnNo = await this.counterService.getNext('purchase-return');

//         const purchaseReturn = await this.purchaseReturnModel.create({
//             returnNo,
//             supplierId: dto.supplierId,
//             returnDate: dto.returnDate,
//             items,
//             totalAmount,
//             notes: dto.notes,
//             createdBy: user._id,
//         });

//         // ✅ Ledger (CREDIT)
//         await this.ledgerService.createTransaction({
//             supplierId: dto.supplierId,
//             debit: 0,
//             credit: totalAmount,
//             type: 'return',
//             referenceType: 'PurchaseReturn',
//             referenceId: purchaseReturn._id,
//             createdBy: user._id as Types.ObjectId,
//         });

//         // ✅ Stock OUT
//         for (const item of items) {
//             await this.stockMovementService.create({
//                 materialId: item.materialId,
//                 type: StockMovementType.RETURN_OUT,
//                 quantity: item.quantity,
//                 unitPrice: item.unitPrice,
//                 referenceType: 'return',
//                 referenceId: purchaseReturn._id,
//                 createdBy: user._id as Types.ObjectId,
//             });
//         }

//         return purchaseReturn;
//     }


// }