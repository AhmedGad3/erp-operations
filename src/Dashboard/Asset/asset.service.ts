import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AssetRepository } from '../../DB/Models/Asset/asset.repository';
import { TAsset, AssetStatus } from '../../DB/Models/Asset/asset.schema';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { TUser } from '../../DB';

@Injectable()
export class AssetService {
    constructor(
        private readonly assetRepository: AssetRepository,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Create Asset
    async createAsset(
        createAssetDto: CreateAssetDto,
        user: TUser,
    ): Promise<TAsset> {
        const lang = this.getLang();

        // Check if code already exists
        const codeExists = await this.assetRepository.findByCode(
            createAssetDto.code,
        );
        if (codeExists) {
            throw new ConflictException(
                this.i18n.translate('assets.errors.codeExists', {
                    lang,
                    args: { code: createAssetDto.code },
                }),
            );
        }

        const assetData = {
            ...createAssetDto,
            code: createAssetDto.code.toUpperCase(),
            createdBy: user._id as Types.ObjectId,
        };

        return this.assetRepository.create(assetData);
    }

    // ✅ Find All
    async findAllAssets(): Promise<TAsset[]> {
        return (await this.assetRepository.find({})) as TAsset[];
    }

    // ✅ Find Active
    async findActiveAssets(): Promise<TAsset[]> {
        return this.assetRepository.findActive();
    }

    // ✅ Find Available
    async findAvailableAssets(): Promise<TAsset[]> {
        return this.assetRepository.findAvailableAssets();
    }

    // ✅ Find by Status
    async findByStatus(status: AssetStatus): Promise<TAsset[]> {
        const lang = this.getLang();

        if (!Object.values(AssetStatus).includes(status)) {
            throw new BadRequestException(
                this.i18n.translate('assets.errors.invalidStatus', { lang }),
            );
        }

        return this.assetRepository.findByStatus(status);
    }

    // ✅ Find by ID
    async findById(id: string): Promise<TAsset> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('assets.errors.invalidId', { lang }),
            );
        }

        const asset = await this.assetRepository.findOne({
            _id: new Types.ObjectId(id),
        });

        if (!asset) {
            throw new NotFoundException(
                this.i18n.translate('assets.errors.notFound', { lang }),
            );
        }

        return asset;
    }

    // ✅ Update
    async updateAsset(
        id: string,
        updateAssetDto: UpdateAssetDto,
        user: TUser,
    ): Promise<TAsset> {
        const lang = this.getLang();

        const asset = await this.assetRepository.findById(id);

        if (!asset) {
            throw new NotFoundException(
                this.i18n.translate('assets.errors.notFound', { lang }),
            );
        }

        // Check if new code conflicts with another asset
        if (updateAssetDto.code && updateAssetDto.code !== asset.code) {
            const duplicate = await this.assetRepository.findOne({
                _id: { $ne: new Types.ObjectId(id) },
                code: updateAssetDto.code.toUpperCase(),
            });

            if (duplicate) {
                throw new ConflictException(
                    this.i18n.translate('assets.errors.codeExists', {
                        lang,
                        args: { code: updateAssetDto.code },
                    }),
                );
            }
        }

        Object.assign(asset, updateAssetDto);
        asset.updatedBy = user._id as Types.ObjectId;

        if (updateAssetDto.code) {
            asset.code = updateAssetDto.code.toUpperCase();
        }

        return asset.save();
    }

    // ✅ Update Status
    async updateStatus(
        id: string,
        status: AssetStatus,
        user: TUser,
    ): Promise<TAsset> {
        const lang = this.getLang();

        if (!Object.values(AssetStatus).includes(status)) {
            throw new BadRequestException(
                this.i18n.translate('assets.errors.invalidStatus', { lang }),
            );
        }

        const asset = await this.assetRepository.findById(id);

        if (!asset) {
            throw new NotFoundException(
                this.i18n.translate('assets.errors.notFound', { lang }),
            );
        }

        const updatedAsset = await this.assetRepository.updateStatus(
            id,
            status,
            user._id as Types.ObjectId,
        );

        return updatedAsset!;
    }

    // ✅ Delete (Soft Delete)
    async deleteAsset(id: string, user: TUser): Promise<TAsset> {
        const lang = this.getLang();

        const asset = await this.assetRepository.findById(id);

        if (!asset || !asset.isActive) {
            throw new NotFoundException(
                this.i18n.translate('assets.errors.notFound', { lang }),
            );
        }

        return (await this.assetRepository.deactivate(
            id,
            user._id as Types.ObjectId,
        ))!;
    }

    // ✅ Activate
    async activateAsset(id: string, user: TUser): Promise<TAsset> {
        const lang = this.getLang();

        const asset = await this.assetRepository.findById(id);

        if (!asset) {
            throw new NotFoundException(
                this.i18n.translate('assets.errors.notFound', { lang }),
            );
        }

        if (asset.isActive) {
            throw new BadRequestException(
                this.i18n.translate('assets.errors.alreadyActive', { lang }),
            );
        }

        const result = await this.assetRepository.activate(
            id,
            user._id as Types.ObjectId,
        );
        return result as TAsset;
    }

    // ✅ Search
    async searchAssets(searchTerm: string): Promise<TAsset[]> {
        return await this.assetRepository.searchAssets(searchTerm);
    }
}