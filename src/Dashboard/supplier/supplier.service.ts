import { Injectable, BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { SupplierRepository } from "src/DB/Models/Supplier/supplier.repository";
import { TUser } from "src/DB";
import { CreateSupplierDto, UpdateSupplierDto } from "./dto";
import { I18nService, I18nContext } from "nestjs-i18n";

@Injectable()
export class SupplierService {
    constructor(
        private readonly supplierRepository: SupplierRepository,
        private readonly i18n: I18nService
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    async createSupplier(dto: CreateSupplierDto, user: TUser) {
        const lang = this.getLang();

        const exists = await this.supplierRepository.findByName(dto.nameAr, dto.nameEn);
        if (exists) {
            throw new ConflictException(this.i18n.translate('suppliers.errors.alreadyExists', { lang }));
        }

        const codeExists = await this.supplierRepository.findByCode(dto.code);
        if (codeExists) {
            throw new ConflictException(this.i18n.translate('suppliers.errors.codeExists', { lang, args: { code: dto.code } }));
        }

        const supplierData: any = {
            ...dto,
            code: dto.code.toUpperCase(),
            createdBy: user._id as Types.ObjectId,
        };

        return this.supplierRepository.create(supplierData);
    }

    async findAllSuppliers() {
        const suppliers = await this.supplierRepository.find({ isActive: true });
        if (!suppliers || suppliers.length === 0) {
            throw new NotFoundException(this.i18n.translate('suppliers.errors.notFound', { lang: this.getLang() }));
        }
        return suppliers;
    }

    async searchSuppliers(searchTerm: string) {
        const lang = this.getLang();
        
        if (!searchTerm || searchTerm.trim() === '') {
            throw new BadRequestException(this.i18n.translate('suppliers.errors.searchTermRequired', { lang }));
        }

        const suppliers = await this.supplierRepository.find({
            isActive: true,
            $or: [
                { nameAr: { $regex: searchTerm, $options: 'i' } },
                { nameEn: { $regex: searchTerm, $options: 'i' } },
                { code: { $regex: searchTerm, $options: 'i' } },
            ]
        });

        return suppliers;
    }

    async findById(id: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(this.i18n.translate('suppliers.errors.invalidId', { lang }));
        }

        const supplier = await this.supplierRepository.findOne({ _id: id, isActive: true });
        if (!supplier || !supplier.isActive) {
            throw new NotFoundException(this.i18n.translate('suppliers.errors.notFound', { lang }));
        }

        return supplier;
    }

    async updateSupplier(id: string, dto: UpdateSupplierDto, user: TUser) {
        const lang = this.getLang();
        const supplier = await this.supplierRepository.findOne({ _id: id, isActive: true });

        if (!supplier || !supplier.isActive) {
            throw new NotFoundException(this.i18n.translate('suppliers.errors.notFound', { lang }));
        }

        if (dto.nameAr || dto.nameEn) {
            const duplicate = await this.supplierRepository.findOne({
                _id: { $ne: id },
                $or: [
                    ...(dto.nameAr ? [{ nameAr: dto.nameAr }] : []),
                    ...(dto.nameEn ? [{ nameEn: dto.nameEn }] : []),
                ]
            });

            if (duplicate) {
                throw new ConflictException(this.i18n.translate('suppliers.errors.nameExists', { lang }));
            }
        }

        Object.assign(supplier, dto);
        supplier.updatedBy = user._id as Types.ObjectId;
        return supplier.save();
    }

    async deleteSupplier(id: string, user: TUser) {
        const supplier = await this.supplierRepository.findOne({ _id: id, isActive: true });
        if (!supplier || !supplier.isActive) {
            throw new NotFoundException(this.i18n.translate('suppliers.errors.notFound', { lang: this.getLang() }));
        }
        await this.supplierRepository.deactivate(id, user._id as Types.ObjectId);
    }

    async activateSupplier(id: string, user: TUser) {
        const supplier = await this.supplierRepository.findById(id);
        if (!supplier) {
            throw new NotFoundException(this.i18n.translate('suppliers.errors.notFound', { lang: this.getLang() }));
        }

        if (supplier.isActive) {
            throw new BadRequestException(this.i18n.translate('suppliers.errors.alreadyActive', { lang: this.getLang() }));
        }

        return this.supplierRepository.activate(id, user._id as Types.ObjectId);
    }
}
