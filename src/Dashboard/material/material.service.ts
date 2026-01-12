import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { I18nContext, I18nService } from "nestjs-i18n";
import { TUser, UnitRepository } from "../../DB";
import { MaterialRepository } from "../../DB/Models/Material/material.repository";
import { CreateMaterialDto } from "./dto";
import { TMaterial } from "../../DB/Models/Material/material.schema";
import { Types } from "mongoose";
import { MainCategory } from "../../Common/Enums";
import { UpdateMaterialDto } from "./dto/update-material.dto";



@Injectable()
export class MaterialService {
    constructor(
        private readonly materialRepository: MaterialRepository,
        private readonly unitRepository: UnitRepository,
        private readonly i18n: I18nService
    ) { }


    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    async createMaterial(createMaterialDto: CreateMaterialDto, user: TUser): Promise<TMaterial> {
        const lang = this.getLang();

        const exists = await this.materialRepository.findByName(
            createMaterialDto.nameAr,
            createMaterialDto.nameEn
        );
        if (exists) {
            throw new ConflictException(
                this.i18n.translate('materials.errors.alreadyExists', { lang })
            );
        }

        const codeExists = await this.materialRepository.findByCode(createMaterialDto.code)
        if (codeExists) {
            throw new ConflictException(
                this.i18n.translate('materials.errors.codeExists', {
                    lang,
                    args: { code: createMaterialDto.code },
                })
            );
        }
         const defaultPurchaseCount = createMaterialDto.alternativeUnits?.filter(
            (u) => u.isDefaultPurchase,
          ).length || 0;
          const defaultIssueCount = createMaterialDto.alternativeUnits?.filter(
            (u) => u.isDefaultIssue,
          ).length || 0;

          if (defaultPurchaseCount > 1) {
            throw new BadRequestException(
              this.i18n.translate('materials.errors.multipleDefaultPurchase', {
                lang,
              }),
            );
          }

          if (defaultIssueCount > 1) {
            throw new BadRequestException(
              this.i18n.translate('materials.errors.multipleDefaultIssue', { lang }),
            );
          }

        const materialData = {
            ...createMaterialDto,
            code: createMaterialDto.code.toUpperCase(),
            baseUnit: new Types.ObjectId(createMaterialDto.baseUnit),
            createdBy: user._id as Types.ObjectId,
        }

        if (materialData.alternativeUnits) {
            materialData.alternativeUnits = materialData.alternativeUnits.map(
                (unit: any) => ({
                    ...unit,
                    unitId: new Types.ObjectId(unit.unitId),
                }),
            );
        }

        const material = await this.materialRepository.create(materialData);

        return material
    }


    async findAllMaterials(): Promise<TMaterial[]> {
        return await this.materialRepository.find({ isActive: true })! as TMaterial[];;
    }


    async getMainCategories() {
        return Object.values(MainCategory).map((cat) => ({
            value: cat,
            label: cat,
        }));

    }
    async findByMainCategory(mainCategory: string): Promise<TMaterial[]> {
        return this.materialRepository.findByMainCategory(mainCategory);
    }


    async findBySubCategory(
        mainCategory: string,
        subCategory: string,
    ): Promise<TMaterial[]> {
        const lang = this.getLang();

        if (!Object.values(MainCategory).includes(mainCategory as MainCategory)) {
            throw new BadRequestException(
                this.i18n.translate('materials.errors.invalidMainCategory', { lang }),
            );
        }

        if (!subCategory || subCategory.trim().length === 0) {
            throw new BadRequestException(
                this.i18n.translate('materials.errors.invalidSubCategory', { lang }),
            );
        }

        return this.materialRepository.findBySubCategory(
            mainCategory,
            subCategory.trim(),
        );
    }




    async findById(id: string): Promise<TMaterial> {

        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('materials.errors.invalidId', { lang }),
            );
        }

        const material = await this.materialRepository.findOne({
            _id: new Types.ObjectId(id),
            isActive: true
        });
        if (!material) {
            throw new NotFoundException(
                this.i18n.translate('materials.errors.notFound', { lang }),
            );
        }

        return material;
    }


    async updateMaterial(id: string, updateMaterialDto: UpdateMaterialDto, user: TUser): Promise<TMaterial> {
        const lang = this.getLang();

        const material = await this.materialRepository.findById(id);

        if (!material) {
            throw new NotFoundException(this.i18n.translate('materials.errors.notFound', { lang }));
        }

        if (updateMaterialDto.nameAr || updateMaterialDto.nameEn) {
            const duplicate = await this.materialRepository.findOne({
                _id: { $ne: new Types.ObjectId(id) },
                $or: [
                    ...(updateMaterialDto.nameAr ? [{ nameAr: updateMaterialDto.nameAr }] : []),
                    ...(updateMaterialDto.nameEn ? [{ nameEn: updateMaterialDto.nameEn }] : []),
                ]
            });

            if (duplicate) {
                throw new ConflictException(this.i18n.translate('materials.errors.nameExists', { lang }));
            }

        }
        if (updateMaterialDto.baseUnit) {
            const baseUnit = await this.unitRepository.findById(updateMaterialDto.baseUnit);
            if (!baseUnit) {
                throw new NotFoundException(this.i18n.translate('units.errors.notFound', { lang }));
            }
            updateMaterialDto.baseUnit = baseUnit.id.toString();
        }

        if (updateMaterialDto.alternativeUnits && updateMaterialDto.alternativeUnits.length > 0) {
            for (const altUnit of updateMaterialDto.alternativeUnits) {
                const unit = await this.unitRepository.findById(altUnit.unitId);
                if (!unit) {
                    throw new NotFoundException(
                        this.i18n.translate('materials.errors.unitNotFound', { lang }),
                    );
                }
            }
        }

        Object.assign(material, updateMaterialDto);
        material.updatedBy = user._id as Types.ObjectId;

        if (material.baseUnit && typeof material.baseUnit === 'string') {
            material.baseUnit = new Types.ObjectId(material.baseUnit);
        }

        if (material.alternativeUnits) {
            material.alternativeUnits = material.alternativeUnits.map(
                (unit: any) => ({
                    ...unit,
                    unitId:
                        typeof unit.unitId === 'string'
                            ? new Types.ObjectId(unit.unitId)
                            : unit.unitId,
                }),
            );
        }

        return material.save();

    }

    async deleteMaterial(id: string, user: TUser) {

        const lang = this.getLang();
        const material = await this.materialRepository.findById(id);
        if (!material || !material.isActive) {
            throw new NotFoundException(this.i18n.translate('materials.errors.notFound', { lang }));
        }
        return await this.materialRepository.deactivate(id, user.id);
    }


    async activateMaterial(id: string, user: TUser): Promise<TMaterial> {
        const lang = this.getLang();
        const material = await this.materialRepository.findById(id);

        if (!material) {
            throw new NotFoundException(this.i18n.translate('materials.errors.notFound', { lang }));
        }

        if (material.isActive) {
            throw new BadRequestException(this.i18n.translate('materials.errors.alreadyActive', { lang }));
        }

        const result = await this.materialRepository.activate(id, user.id);
        return result as TMaterial
    }

    async searchMaterials(searchTerm: string): Promise<TMaterial[]> {

        return  await this.materialRepository.searchMaterials(searchTerm);
    }

}
