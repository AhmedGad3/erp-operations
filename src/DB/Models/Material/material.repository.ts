import { Document, FilterQuery, Model, ProjectionType, QueryOptions, Types } from "mongoose";
import { DBService } from "src/DB/db.service";
import { Material, TMaterial } from "./material.schema";
import { InjectModel } from "@nestjs/mongoose";
import { MaterialModel } from './material.model';



interface DropdownMaterial {
    _id: Types.ObjectId;
    nameAr: string;
    nameEn: string;
    code: string;
    currentStock: number;
}


export class MaterialRepository extends DBService<TMaterial> {
    constructor(
        @InjectModel(Material.name) private readonly materialModel: Model<TMaterial>,
    ) {
        super(materialModel)

    }

    async findById(id: string | Types.ObjectId): Promise<TMaterial | null> {
        return this.materialModel.findById(id);
    }

    async findByName(nameAr?: string, nameEn?: string): Promise<TMaterial | null> {
        if (!nameAr && !nameEn) return null;

        const orConditions: FilterQuery<TMaterial>[] = [];
        if (nameAr) orConditions.push({ nameAr });
        if (nameEn) orConditions.push({ nameEn });

        return this.findOne({ $or: orConditions });
    }

    async findByCode(code: string): Promise<TMaterial | null> {
        return this.findOne({ code: code.toUpperCase() });
    }

    async findByMainCategory(mainCategory: string): Promise<TMaterial[]> {
        const result = await this.find({
            mainCategory,
            isActive: true,
        });
        return result || [];
    }


    async findBySubCategory(
        mainCategory: string,
        subCategory: string,
    ): Promise<TMaterial[]> {
        const result = await this.find({
            mainCategory,
            subCategory,
            isActive: true,
        });
        return result || [];
    }

    async searchMaterials(searchTerm: string): Promise<TMaterial[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            const result = await this.find({ isActive: true });
            return result || [];
        }

        const searchRegex = new RegExp(searchTerm.trim(), 'i');

        return this.materialModel
            .find({
                isActive: true,
                $or: [
                    { nameAr: searchRegex },
                    { nameEn: searchRegex },
                    { code: searchRegex },
                    { subCategory: searchRegex },
                ],
            })
            .populate('baseUnit', 'nameAr nameEn code symbol')
            .sort({ code: 1 })
            .exec();
    }

    async findForDropdown(
        filter: FilterQuery<TMaterial> = {},
    ): Promise<DropdownMaterial[]> {
        return this.materialModel
            .find({ ...filter, isActive: true })
            .select('_id nameAr nameEn code currentStock')
            .sort({ nameAr: 1 })
            .lean<DropdownMaterial[]>()
            .exec();
    }
    async deactivate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TMaterial | null> {
        return this.materialModel
            .findByIdAndUpdate(
                id,
                { isActive: false, updatedBy: userId },
                { new: true },
            )
            .exec();
    }
    async activate(
        id: string | Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<TMaterial | null> {
        return this.materialModel
            .findByIdAndUpdate(
                id,
                { isActive: true, updatedBy: userId },
                { new: true },
            )
            .exec();
    }

    async updateStock(
        id: string | Types.ObjectId,
        quantity: number,
    ): Promise<TMaterial | null> {
        return this.materialModel
            .findByIdAndUpdate(
                id,
                { $inc: { currentStock: quantity } },
                { new: true },
            )
            .exec();
    }
    async findActiveById(id: string | Types.ObjectId): Promise<TMaterial | null> {
        return this.materialModel.findOne({ _id: id, isActive: true }).exec();
    }

    
}