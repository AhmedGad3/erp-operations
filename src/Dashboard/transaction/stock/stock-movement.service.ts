
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { StockMovement, StockMovementDocument, StockMovementType } from "src/DB/Models/Transaction/stock-movement.schema";
import { CounterService } from "../common/counter.service";
import { MaterialRepository } from "src/DB";

@Injectable()
export class StockMovementService {
    constructor(
        @InjectModel(StockMovement.name)
        private readonly stockModel: Model<StockMovementDocument>,

        private readonly materialRepository: MaterialRepository,
        private readonly counterService: CounterService,
    ) {}

    private getSignedQuantity(type: StockMovementType, qty: number): number {
        switch (type) {
            case StockMovementType.IN:
            case StockMovementType.RETURN_IN:
            case StockMovementType.PROJECT_RETURN:
            case StockMovementType.ADJUSTMENT_IN:
                return +qty;
            
            case StockMovementType.OUT:
            case StockMovementType.RETURN_OUT:
            case StockMovementType.PROJECT_ISSUE:
            case StockMovementType.ADJUSTMENT_OUT:
                return -qty;
            
            default:
                throw new BadRequestException('Invalid stock movement type');
        }
    }

    async create(data: {
        materialId: Types.ObjectId;
        unitId: Types.ObjectId;
        type: StockMovementType;
        quantity: number;
        referenceType: string;
        referenceId: Types.ObjectId; 
        lastPurchasePrice?: number;
        lastPurchaseDate?: Date;
        unitPrice?: number;
        projectId?: Types.ObjectId;
        notes?: string;
        createdBy: Types.ObjectId;
    }) {
        const material = await this.materialRepository.findById(data.materialId);
        if (!material) {
            throw new BadRequestException('Material not found');
        }

        let conversionFactor = 1;
        if (data.unitId.toString() !== material.baseUnit.toString()) {
            const altUnit = material.alternativeUnits?.find(
                u => u.unitId.toString() === data.unitId.toString()
            );
            if (!altUnit) {
                throw new BadRequestException('Invalid unit for this material');
            }
            conversionFactor = altUnit.conversionFactor;
        }

        const quantityInBaseUnit = data.quantity * conversionFactor;

        const lastMovement = await this.stockModel
            .findOne({ materialId: data.materialId })
            .sort({ movementDate: -1, _id: -1 });

        const lastBalance = lastMovement?.balanceAfter ?? material.currentStock ?? 0;

        const signedQuantity = this.getSignedQuantity(data.type, quantityInBaseUnit);
        const balanceAfter = lastBalance + signedQuantity;

        if (balanceAfter < 0 && 
            ![StockMovementType.ADJUSTMENT_IN, StockMovementType.IN].includes(data.type)
        ) {
            throw new BadRequestException('Insufficient stock');
        }

        const movementNo = await this.counterService.getNext('stock-movement');

        const movement = await this.stockModel.create({
            ...data,
            movementNo,
            balanceAfter,
            movementDate: new Date(),
        });

        const materialUpdate: Record<string, any> = {
            currentStock: balanceAfter,
            updatedAt: new Date(),
        };

        if (
            [StockMovementType.IN, StockMovementType.RETURN_IN].includes(data.type) &&
            data.unitPrice != null
        ) {
            materialUpdate.lastPurchasePrice = data.unitPrice;
            materialUpdate.lastPurchaseDate = new Date();
        }

        await this.materialRepository.updateOne(
            { _id: data.materialId },
            { $set: materialUpdate }
        );

        return movement;
    }

  async createAdjustment(data: {
    materialId: Types.ObjectId;
    unitId: Types.ObjectId;
    actualQuantity: number; 
    reason: string;
    createdBy: Types.ObjectId;
}) {
    const material = await this.materialRepository.findById(data.materialId);
    if (!material) {
        throw new BadRequestException('Material not found');
    }

    let conversionFactor = 1;
    if (data.unitId.toString() !== material.baseUnit.toString()) {
        const altUnit = material.alternativeUnits?.find(
            u => u.unitId.toString() === data.unitId.toString()
        );
        if (!altUnit) {
            throw new BadRequestException('Invalid unit for this material');
        }
        conversionFactor = altUnit.conversionFactor;
    }

    const actualQuantityInBaseUnit = data.actualQuantity * conversionFactor;
    const currentStock = material.currentStock ?? 0;

    const difference = actualQuantityInBaseUnit - currentStock;

    if (difference === 0) {
        throw new BadRequestException('No adjustment needed - stock matches actual count');
    }

    const adjustmentType = difference > 0 
        ? StockMovementType.ADJUSTMENT_IN 
        : StockMovementType.ADJUSTMENT_OUT;

    const adjustmentQuantity = Math.abs(difference);

    return this.create({
        materialId: new Types.ObjectId(data.materialId) ,
        unitId: new Types.ObjectId(material.baseUnit), 
        type: adjustmentType,
        quantity: adjustmentQuantity, 
        referenceType: 'StockAdjustment',
        referenceId: new Types.ObjectId(),
        notes: `Adjustment: ${data.reason} | Diff: ${difference > 0 ? '+' : ''}${difference}`,
        createdBy: data.createdBy,
    });
}

}