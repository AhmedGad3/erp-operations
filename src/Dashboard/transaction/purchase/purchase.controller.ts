import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Auth } from "../../../Common";
import { I18nService, I18nContext } from "nestjs-i18n";
import { PurchaseService } from "./purchase.service";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { CreatePurchaseReturnDto } from "./dto/create-purchase-return.dto";
import { TUser } from "../../../DB";

@Auth('admin')
@Controller('/admin/purchases')
export class PurchaseController {
    constructor(
        private readonly purchaseService: PurchaseService,
        private readonly i18n: I18nService,
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Auth('admin')
    @Post()
    async createPurchase(@Body() dto: CreatePurchaseDto, @Req() req: Request) {
        const invoice = await this.purchaseService.createPurchase(dto, req['user']);
        const message = this.i18n.translate('purchases.created', { lang: this.getLang() });
        return { result: invoice, message };
    }

    @Auth('admin')
    @Post('return')
    async createReturn(
        @Body() dto: CreatePurchaseReturnDto,
        @Req() req: Request,
    ) {
        const returnedInvoice = await this.purchaseService.createPurchaseReturn(dto, req['user']);

        const message = this.i18n.translate('purchases.returned', { lang: this.getLang() });
        return { result: returnedInvoice, message };
    }


    @Auth('admin', 'accountant', 'manager')
    @Get()
    async getAllPurchases() {
        const purchases = await this.purchaseService.findAll();
        const message = this.i18n.translate('purchases.fetched', { lang: this.getLang() });
        return { result: purchases, message };
    }
    @Auth('admin', 'accountant', 'manager')
    @Get('return')
    async getAllPurchasesReturns() {
        const returns = await this.purchaseService.findAllReturns();
        const message = this.i18n.translate('returns.fetched', { lang: this.getLang() });
        return { result: returns, message };
    }

    @Auth('admin', 'accountant', 'manager')
    @Get('supplier/:supplierId/open')
    async getOpenInvoices(@Param('supplierId') supplierId: string) {
        const invoices = await this.purchaseService.getOpenInvoices(supplierId);
        const message = this.i18n.translate('purchases.openFetched', { lang: this.getLang() });
        return { result: invoices, message };
    }

    @Auth('admin', 'accountant', 'manager')
    @Get('supplier/:supplierId')
    async getPurchasesBySupplier(@Param('supplierId') supplierId: string) {
        const purchases = await this.purchaseService.findBySupplier(supplierId);
        const message = this.i18n.translate('purchases.bySupplierFetched', { lang: this.getLang() });
        return { result: purchases, message };
    }

    @Auth('admin', 'accountant', 'manager')
    @Get(':id')
    async getPurchase(@Param('id') id: string) {
        const invoice = await this.purchaseService.findById(id);
        const message = this.i18n.translate('purchases.fetched', { lang: this.getLang() });
        return { invoice, message };
    }
}
