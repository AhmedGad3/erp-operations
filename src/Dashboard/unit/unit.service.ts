import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { UnitRepository } from "src/DB/Models/Unit/unit.repository";
import { ConvertUnitDto, CreateUnitDto, UpdateUnitDto } from "./dto";
import { TUser } from "src/DB";
import { TUnit, Unit } from "src/DB/Models/Unit/unit.schema";
import mongoose, { Model, Types } from "mongoose";
import { UnitConverter } from "src/Common";
import { UnitCategory } from "src/Common/Enums";
import { I18nContext, I18nService } from "nestjs-i18n";
import { UnitModel } from 'src/DB/Models/Unit/unit.model';
import { InjectModel } from "@nestjs/mongoose";



@Injectable()
export class UnitService {
 
    constructor(
        private readonly unitRepository: UnitRepository,
        
        private readonly i18n: I18nService,
         @InjectModel(Unit.name) private readonly unitModel: Model<TUnit>
    ){}

      private getLang(): string {
    return I18nContext.current()?.lang || 'ar';
  }

  async createUnit(createUnitDto: CreateUnitDto, user: TUser): Promise<TUnit> {
  const lang = this.getLang();

  const exists = await this.unitRepository.findByName(
    createUnitDto.nameAr,
    createUnitDto.nameEn,
  );
  if (exists) {
    throw new ConflictException(
      this.i18n.translate('units.errors.alreadyExists', { lang })
    );
  }

  const codeExists = await this.unitRepository.findByCode(createUnitDto.code);
  if (codeExists) {
    throw new ConflictException(
      this.i18n.translate('units.errors.codeExists', {
        lang,
        args: { code: createUnitDto.code },
      })
    );
  }

  if (createUnitDto.isBase) {
    const existingBase = await this.unitRepository.findBaseUnitByCategory(
      createUnitDto.category,
    );

    if (existingBase) {
      throw new ConflictException(
        this.i18n.translate('units.errors.categoryHasBase', {
          lang,
          args: {
            category: createUnitDto.category,
            unit: existingBase.nameAr,
          },
        })
      );
    }

    createUnitDto.conversionFactor = 1;
    createUnitDto.baseUnitId = undefined; 
  }

  if (!createUnitDto.isBase) {
    if (!createUnitDto.baseUnitId) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.baseUnitRequired', { lang })
      );
    }

    const baseUnit = await this.unitRepository.findById(
      createUnitDto.baseUnitId,
    );
    if (!baseUnit) {
      throw new NotFoundException(
        this.i18n.translate('units.errors.baseUnitNotFound', { lang })
      );
    }

    if (!baseUnit.isBase) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.mustBeBaseUnit', { lang })
      );
    }

    if (baseUnit.category !== createUnitDto.category) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.differentCategory', { lang })
      );
    }

    if (
      !createUnitDto.conversionFactor ||
      createUnitDto.conversionFactor <= 0
    ) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.conversionFactorRequired', { lang })
      );
    }
  }

  const unitData: any  = {
    ...createUnitDto,
    createdBy: user._id as Types.ObjectId,
  };

  if (unitData.baseUnitId) {
    unitData.baseUnitId = new Types.ObjectId(unitData.baseUnitId);
  }

  const unit = await this.unitRepository.create(unitData);

  return unit;
}

   async findAllUnits(category?: string): Promise<TUnit[]> {
    if (category) {
      return await this.unitRepository.findByCategory(category);
    }
    const result = await this.unitRepository.find({ isActive: true });

    return result || [];
  }

 async findBaseUnits(): Promise<TUnit[]> {
    return await this.unitRepository.findActiveBaseUnits();
  }

  async findDerivedUnits(baseUnitId: string): Promise<TUnit[]> {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(baseUnitId)) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.invalidId', { lang })
      );
    }

    const baseUnit = await this.findById(baseUnitId);
    if (!baseUnit.isBase) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.notBaseUnit', { lang })
      );
    }

    return this.unitRepository.findDerivedUnits(baseUnitId);
  }

  async findById(id: string): Promise<TUnit> {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.invalidId', { lang })
      );
    }

    const unit = await this.unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundException(
        this.i18n.translate('units.errors.notFound', { lang })
      );
    }

    return unit;
  }



async updateUnit(
  id: string,
  updateUnitDto: UpdateUnitDto,
  userId: Types.ObjectId,  
): Promise<TUnit> {
  const lang = this.getLang();  
  
  const unit = await this.findById(id);

  if (updateUnitDto.nameAr || updateUnitDto.nameEn) {
    const duplicate = await this.unitRepository.findOne({
      _id: { $ne: id },
      $or: [
        ...(updateUnitDto.nameAr ? [{ nameAr: updateUnitDto.nameAr }] : []),
        ...(updateUnitDto.nameEn ? [{ nameEn: updateUnitDto.nameEn }] : []),
      ],
    });

    if (duplicate) {
      throw new ConflictException(
        this.i18n.translate('units.errors.nameExists', { lang }) 
      );
    }
  }

  if (updateUnitDto.code && updateUnitDto.code !== unit.code) {
    const codeExists = await this.unitRepository.findByCode(updateUnitDto.code);
    
    if (codeExists) {
      throw new ConflictException(
        this.i18n.translate('units.errors.codeExists', {
          lang,
          args: { code: updateUnitDto.code },
        })
      );
    }
  }

  Object.assign(unit, updateUnitDto);
  unit.updatedBy = userId;  

  return await unit.save(); 
}

 async deleteUnit(
    id: string,
    userId: Types.ObjectId,
  ): Promise<{ message: string }> {
    const lang = this.getLang();
    const unit = await this.findById(id);

    if (!unit.isActive) {
      throw new NotFoundException(
        this.i18n.translate('units.errors.alreadyDeleted', { lang })
      );
    }

    // const isInUse = await this.unitRepository.isUnitInUse(id);
    // if (isInUse) {
    //   throw new BadRequestException(
    //     this.i18n.translate('units.errors.unitInUse', { lang })
    //   );
    // }

    await this.unitRepository.deactivate(id, userId);

    return {
      message: this.i18n.translate('units.deleted', { lang }),
    };
  }

   async activateUnit(
    id: string,
    userId: Types.ObjectId,
  ): Promise<{ message: string }> {
    const lang = this.getLang();
    const unit = await this.findById(id);

    if (unit.isActive) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.alreadyActive', { lang })
      );
    }

    await this.unitRepository.activate(id, userId);

    return {
      message: this.i18n.translate('units.activated', { lang }),
    };
  }

async searchUnits(searchTerm: string): Promise<TUnit[]> {
  const filter: any = { isActive: true };

  if (searchTerm && searchTerm.trim().length > 0) {
    const regex = new RegExp(searchTerm.trim(), 'i');
    filter.$or = [
      { nameAr: regex },
      { nameEn: regex },
      { code: regex },
      { symbol: regex }
    ];
  }

  return this.unitModel
    .find(filter)
    .select('nameAr nameEn code symbol category isBase')
    .sort({ nameAr: 1 })
    .exec();
}

   async findForDropdown(category?: string) {
    const filter: any = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const units = await this.unitRepository.findForDropdown(filter);

    return units.map((unit: any) => ({
      id: unit._id.toString(),
      nameAr: unit.nameAr,
      nameEn: unit.nameEn,
      code: unit.code,
      symbol: unit.symbol,
    }));
  }

async convertUnits(convertDto: ConvertUnitDto) {
    const lang = this.getLang();
  const fromUnit = await this.findById(convertDto.fromUnitId);
  const toUnit = await this.findById(convertDto.toUnitId);


  if (!fromUnit.isActive || !toUnit.isActive) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.inactiveUnits', { lang })
      );
    }


 if (fromUnit.category !== toUnit.category) {
      throw new BadRequestException(
        this.i18n.translate('units.errors.differentCategories', { lang })
      );
    }
  const convertedQuantity = UnitConverter.convert(
    convertDto.quantity,
    fromUnit,
    toUnit,
  );

  return {
    originalQuantity: convertDto.quantity,
    originalUnit: {
      id: fromUnit._id,
      nameAr: fromUnit.nameAr,
      symbol: fromUnit.symbol,
    },
    convertedQuantity: Math.round(convertedQuantity * 1000000) / 1000000, 
    convertedUnit: {
      id: toUnit._id,
      nameAr: toUnit.nameAr,
      symbol: toUnit.symbol,
    },
  };
}
}