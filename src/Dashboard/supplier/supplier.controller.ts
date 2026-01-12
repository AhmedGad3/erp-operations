import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import { SupplierService } from "./supplier.service";
import { I18nService, I18nContext } from "nestjs-i18n";
import { Auth } from "../../Common";
import { CreateSupplierDto, UpdateSupplierDto } from "./dto";

@Auth('admin')
@Controller('/admin/suppliers')
export class SupplierController {
    constructor(
        private readonly supplierService: SupplierService,
        private readonly i18n: I18nService
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Post()
    async createSupplier(@Body() dto: CreateSupplierDto, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.supplierService.createSupplier(dto, req['user']);
        return { result, message: this.i18n.translate('suppliers.created', { lang }) };
    }

    @Get()
    async findAllSuppliers() {
        const lang = this.getLang();
        const result = await this.supplierService.findAllSuppliers();
        return { result, message: this.i18n.translate('suppliers.fetched', { lang }) };
    }

    @Get('search')
    async searchSuppliers(@Query('q') searchTerm: string) {
        const lang = this.getLang();
        const result = await this.supplierService.searchSuppliers(searchTerm);
        return { result, message: this.i18n.translate('suppliers.fetched', { lang }) };
    }

    @Get(':id')
    async findById(@Param('id') supplierId: string) {
        const lang = this.getLang();
        const result = await this.supplierService.findById(supplierId);
        return { result, message: this.i18n.translate('suppliers.fetched', { lang }) };
    }

    @Put(':id')
    async updateSupplier(@Param('id') supplierId: string, @Body() dto: UpdateSupplierDto, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.supplierService.updateSupplier(supplierId, dto, req['user']);
        return { result, message: this.i18n.translate('suppliers.updated', { lang }) };
    }

    @Delete(':id')
    async deleteSupplier(@Param('id') supplierId: string, @Req() req: Request) {
        const lang = this.getLang();
        await this.supplierService.deleteSupplier(supplierId, req['user']);
        return { message: this.i18n.translate('suppliers.deleted', { lang }) };
    }

    @Patch(':id/activate')
    async activateSupplier(@Param('id') supplierId: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.supplierService.activateSupplier(supplierId, req['user']);
        return { result, message: this.i18n.translate('suppliers.activated', { lang }) };
    }
}
