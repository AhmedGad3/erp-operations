import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import { MaterialService } from "./material.service";
import { I18nContext, I18nService } from "nestjs-i18n";
import { CreateMaterialDto } from "./dto";
import { Auth } from "../../Common";
import { UpdateMaterialDto } from "./dto/update-material.dto";



@Auth('admin')
@Controller('/admin/materials')
export class MaterialController {
    constructor(
        private readonly materialService: MaterialService,
        private readonly i18n: I18nService

    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Auth('admin')
    @Post()
    async createMaterial(@Body() createMaterialDto: CreateMaterialDto, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.materialService.createMaterial(createMaterialDto, req['user']);
        return { result, message: this.i18n.translate('materials.created', { lang }) };
    }


    @Auth('admin', 'accountant', 'manager')
    @Get()
    async findAllMaterials() {
        const lang = this.getLang();
        const result = await this.materialService.findAllMaterials();
        return { result, message: this.i18n.translate('materials.fetched', { lang }) };
    }


    @Auth('admin', 'accountant', 'manager')
    @Get('/main-categories')
    async getMainCategories() {
        const lang = this.getLang();
        const result = await this.materialService.getMainCategories();
        return { result, message: this.i18n.translate('materials.fetched', { lang }) };
    }

    @Auth('admin', 'accountant', 'manager')
    @Get('/sub-categories')
    async getSubCategories(
        @Query('main-category') mainCategory: string,
        @Query('sub-category') subCategory: string,
    ) {
        const lang = this.getLang();
        const result = await this.materialService.findBySubCategory(mainCategory, subCategory);
        return { result, message: this.i18n.translate('materials.fetched', { lang }) };
    }

    @Auth('admin', 'accountant', 'manager')
    @Get('search')
    async searchMaterials(@Query('q') searchTerm: string) {
        const lang = this.getLang();
        const result = await this.materialService.searchMaterials(searchTerm);
        return { result, message: this.i18n.translate('materials.fetched', { lang }) };

    }

    @Auth('admin', 'accountant', 'manager')
    @Get(':id')
    async findById(@Param('id') materialId: string) {
        const lang = this.getLang()

        const result = await this.materialService.findById(materialId);

        return { result, message: this.i18n.translate('materials.fetched', { lang }) };
    }


    @Auth('admin')
    @Put(':id')
    async updateMaterial(@Param('id') materialId: string, @Body() updateMaterialDto: UpdateMaterialDto, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.materialService.updateMaterial(materialId, updateMaterialDto, req['user']);
        return { result, message: this.i18n.translate('materials.updated', { lang }) };
    }

    @Auth('admin')
    @Delete(':id')
    async deleteMaterial(@Param('id') materialId: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.materialService.deleteMaterial(materialId, req['user']);
        return { result, message: this.i18n.translate('materials.deleted', { lang }) };
    }

    @Auth('admin')
    @Patch(':id/activate')
    async activateMaterial(@Param('id') materialId: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.materialService.activateMaterial(materialId, req['user']);
        return { result, message: this.i18n.translate('materials.activated', { lang }) };
    }
}
