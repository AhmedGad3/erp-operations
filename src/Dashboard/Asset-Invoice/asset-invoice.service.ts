import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { TUser } from '../../DB';
import { AssetRepository } from '../../DB/Models/Asset/asset.repository';
import { CounterService } from '../transaction/common/counter.service';
import { AssetInvoiceRepository } from 'src/DB/Models/AssetInvoice/Asset-Invoice.repository';
import { CreateAssetInvoiceDto } from './dto';
import { TAssetInvoice } from 'src/DB/Models/AssetInvoice/Asset-Invoice.schema';

@Injectable()
export class AssetInvoiceService {
    constructor(
        private readonly assetInvoiceRepo: AssetInvoiceRepository,
        private readonly assetRepo: AssetRepository,
        private readonly counterService: CounterService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Create
    async create(dto: CreateAssetInvoiceDto, user: TUser): Promise<TAssetInvoice> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(dto.assetId)) {
            throw new BadRequestException(
                this.i18n.translate('asset_invoices.errors.invalidId', { lang }),
            );
        }

        const asset = await this.assetRepo.findById(dto.assetId);
        if (!asset || !asset.isActive) {
            throw new NotFoundException(
                this.i18n.translate('asset_invoices.errors.assetNotFound', { lang }),
            );
        }

        const existingInvoice = await this.assetInvoiceRepo.findByAssetId(dto.assetId);
        if (existingInvoice) {
            throw new ConflictException(
                this.i18n.translate('asset_invoices.errors.invoiceExists', { lang }),
            );
        }

        const invoiceNo = await this.counterService.getNext('asset-invoice');

        const invoice = await this.assetInvoiceRepo.create({
            invoiceNo,
            asset: new Types.ObjectId(dto.assetId),
            vendorName: dto.vendorName,
            amount: dto.amount,
            invoiceDate: new Date(dto.invoiceDate),
            paymentMethod: dto.paymentMethod,
            referenceNo: dto.referenceNo,
            notes: dto.notes,
            createdBy: user._id as Types.ObjectId,
        });

        return this.assetInvoiceRepo.findById(invoice._id) as Promise<TAssetInvoice>;
    }

    // ✅ Find All
    async findAll(): Promise<TAssetInvoice[]> {
        return this.assetInvoiceRepo.findAllActive();
    }

    // ✅ Find One
    async findOne(id: string): Promise<TAssetInvoice> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('asset_invoices.errors.invalidId', { lang }),
            );
        }

        const invoice = await this.assetInvoiceRepo.findActiveById(id);
        if (!invoice) {
            throw new NotFoundException(
                this.i18n.translate('asset_invoices.errors.notFound', { lang }),
            );
        }

        return invoice;
    }

    // ✅ Delete (Soft)
    async remove(id: string, user: TUser): Promise<TAssetInvoice> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('asset_invoices.errors.invalidId', { lang }),
            );
        }

        const invoice = await this.assetInvoiceRepo.findActiveById(id);
        if (!invoice) {
            throw new NotFoundException(
                this.i18n.translate('asset_invoices.errors.notFound', { lang }),
            );
        }

        return (await this.assetInvoiceRepo.deactivate(
            id,
            user._id as Types.ObjectId,
        )) as TAssetInvoice;
    }

    // ✅ Pagination
    async findWithPagination(page: number, limit: number) {
        return this.assetInvoiceRepo.findWithPagination(+page, +limit);
    }

    // ✅ Total Amount
    async getTotalAmount(startDate?: Date, endDate?: Date): Promise<number> {
        return this.assetInvoiceRepo.getTotalAmount(startDate, endDate);
    }
}