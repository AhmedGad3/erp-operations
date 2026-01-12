import { Injectable } from "@nestjs/common";
import { DBService } from "src/DB/db.service";
import { TUnit, Unit } from "./unit.schema";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";



@Injectable()
export class UnitRepository extends DBService<TUnit> {
    constructor(@InjectModel(Unit.name) private readonly unitModel: Model<TUnit>)
    {super(unitModel)}
    
 async findByName(nameAr?: string, nameEn?: string): Promise<TUnit | null> {
    if (!nameAr && !nameEn) {
      return null;
    }

    const orConditions: FilterQuery<TUnit>[] = [];
    if (nameAr) orConditions.push({ nameAr });
    if (nameEn) orConditions.push({ nameEn });

    return await this.findOne({ $or: orConditions });
  }

  async findByIdAndUpdate(id: string, update: Partial<TUnit>): Promise<TUnit | null> {
    return await this.unitModel
    .findByIdAndUpdate(id, update, { new: true })
     
  }

    async findByCode(code: string): Promise<TUnit | null> {
    return await this.findOne({ code: code.toUpperCase() });
  }

   async findBaseUnitByCategory(category: string): Promise<TUnit | null> {
    return await this.findOne({ 
      category, 
      isBase: true,
      isActive: true 
    });
  }
  async findByCategory(category: string): Promise<TUnit[]> {
  const result = await this.find({
    category,
    isActive: true,
  });
  return result || [];
}

  
async findActiveBaseUnits(): Promise<TUnit[]> {
  const result = await this.find({
    isBase: true,
    isActive: true,
  });
  return result || [];
}

 async findDerivedUnits(baseUnitId: string | Types.ObjectId): Promise<TUnit[]> {
  const result = await this.find({
    baseUnitId: new Types.ObjectId(baseUnitId),
    isActive: true,
  });
  return result || [];
}

   async searchUnits(searchTerm: string): Promise<any[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      const result = await this.find({ isActive: true });
      return result || [];
    }

    const searchRegex = new RegExp(searchTerm.trim(), 'i');

    return this.unitModel
      .find({
        isActive: true,
        $or: [
          { nameAr: searchRegex },
          { nameEn: searchRegex },
          { code: searchRegex },
          { symbol: searchRegex }
        ]
      })
      .select('nameAr nameEn code symbol category isBase baseUnitId conversionFactor')
      .sort({ nameAr: 1 })
      .exec();
  }

   async findForDropdown(filter: FilterQuery<TUnit> = {}): Promise<Partial<TUnit>[]> {
    return this.unitModel
      .find({ 
        ...filter, 
        isActive: true 
      })
      .select('_id nameAr nameEn code symbol')
      .sort({ nameAr: 1 })
  }

//   async isUnitInUse(unitId: string | Types.ObjectId): Promise<boolean> {
//     const id = new Types.ObjectId(unitId);
    
//     const derivedCount = await this.count({ 
//       baseUnitId: id,
//       isActive: true 
//     });

//     if (derivedCount > 0) return true;

//     // TODO: تحقق من استخدامها في Materials
//     // const materialsCount = await this.materialsModel.countDocuments({
//     //   $or: [
//     //     { baseUnitId: id },
//     //     { 'alternativeUnits.unitId': id }
//     //   ]
//     // });
//     // if (materialsCount > 0) return true;

//     return false;
//   }

   async deactivate(id: string | Types.ObjectId, userId: Types.ObjectId): Promise<TUnit | null> {
    return this.unitModel
      .findByIdAndUpdate(
        id,
        { 
          isActive: false,
          updatedBy: userId 
        },
        { new: true }
      )
  }

   async activate(id: string | Types.ObjectId, userId: Types.ObjectId): Promise<TUnit | null> {
    return this.unitModel
      .findByIdAndUpdate(
        id,
        { 
          isActive: true,
          updatedBy: userId 
        },
        { new: true }
      )
  }

}
