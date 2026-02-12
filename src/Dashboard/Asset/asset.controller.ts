import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/index';
import { UpdateAssetDto } from './dto/index';
import { UpdateAssetStatusDto } from './dto/update-asset-status.dto';
import { Auth } from '../../Common';
import { AssetStatus } from '../../DB/Models/Asset/asset.schema';

@Auth('admin')
@Controller('/admin/assets')
export class AssetController {
    constructor(
        private readonly assetService: AssetService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Create Asset
    @Post()
    async createAsset(
        @Body() createAssetDto: CreateAssetDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.assetService.createAsset(
            createAssetDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('assets.created', { lang }),
        };
    }

    // ✅ Get All Assets
    @Get()
    async findAllAssets() {
        const lang = this.getLang();
        const result = await this.assetService.findAllAssets();
        return {
            result,
            message: this.i18n.translate('assets.fetched', { lang }),
        };
    }

    // ✅ Get Active Assets
    @Get('active')
    async findActiveAssets() {
        const lang = this.getLang();
        const result = await this.assetService.findActiveAssets();
        return {
            result,
            message: this.i18n.translate('assets.fetched', { lang }),
        };
    }

    // ✅ Get Available Assets
    @Get('available')
    async findAvailableAssets() {
        const lang = this.getLang();
        const result = await this.assetService.findAvailableAssets();
        return {
            result,
            message: this.i18n.translate('assets.fetched', { lang }),
        };
    }

    // ✅ Get Assets by Status
    @Get('status/:status')
    async findByStatus(@Param('status') status: AssetStatus) {
        const lang = this.getLang();
        const result = await this.assetService.findByStatus(status);
        return {
            result,
            message: this.i18n.translate('assets.fetched', { lang }),
        };
    }

    // ✅ Search Assets
    @Get('search')
    async searchAssets(@Query('q') searchTerm: string) {
        const lang = this.getLang();
        const result = await this.assetService.searchAssets(searchTerm);
        return {
            result,
            message: this.i18n.translate('assets.fetched', { lang }),
        };
    }

    // ✅ Get Asset by ID
    @Get(':id')
    async findById(@Param('id') assetId: string) {
        const lang = this.getLang();
        const result = await this.assetService.findById(assetId);
        return {
            result,
            message: this.i18n.translate('assets.fetched', { lang }),
        };
    }

    // ✅ Update Asset
    @Put(':id')
    async updateAsset(
        @Param('id') assetId: string,
        @Body() updateAssetDto: UpdateAssetDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.assetService.updateAsset(
            assetId,
            updateAssetDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('assets.updated', { lang }),
        };
    }

    // ✅ Update Asset Status
    @Patch(':id/status')
    async updateStatus(
        @Param('id') assetId: string,
        @Body() updateStatusDto: UpdateAssetStatusDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.assetService.updateStatus(
            assetId,
            updateStatusDto.status,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('assets.statusUpdated', { lang }),
        };
    }

    // ✅ Delete Asset (Soft Delete)
    @Delete(':id')
    async deleteAsset(@Param('id') assetId: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.assetService.deleteAsset(assetId, req['user']);
        return {
            result,
            message: this.i18n.translate('assets.deleted', { lang }),
        };
    }

    // ✅ Activate Asset
    @Patch(':id/activate')
    async activateAsset(@Param('id') assetId: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.assetService.activateAsset(
            assetId,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('assets.activated', { lang }),
        };
    }
}