import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Auth } from "../../../../Common";
import { I18nService, I18nContext } from "nestjs-i18n";
import { CreatePaymentDto } from "./dto/create-supplier-payment.dto";
import { CreateSupplierRefundDto } from "./dto/create-supplier-refund.dto";
import { Supplier } from './../../../../DB/Models/Supplier/supplier.schema';
import { SupplierPaymentService } from "./supplier.payment.service";

@Auth('admin')
@Controller('/admin/supplier/payments')
export class SupplierPaymentController {
    constructor(
        private readonly supplierPaymentService: SupplierPaymentService,
        private readonly i18n: I18nService,
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Post()
    async createPayment(@Body() dto: CreatePaymentDto, @Req() req: Request) {
        const payment = await this.supplierPaymentService.createPayment(dto, req['user']);
        const message = this.i18n.translate('payments.created', { lang: this.getLang() });
        return { result: payment, message };
    }

    @Post('refund')
    async createRefund(
        @Body() dto: CreateSupplierRefundDto,
        @Req() req: Request,
    ) {
        const refundedPayment = await this.supplierPaymentService.createRefund(dto, req['user']);
        console.log(refundedPayment);

        const message = this.i18n.translate('payments.refunded', { lang: this.getLang() });
        return { refundedPayment, message };
    }

    @Get()
    async getAllPayments() {

        const payments = await this.supplierPaymentService.getAllPayments();
        return { result: payments, message: this.i18n.translate('payments.fetched', { lang: this.getLang() }) };
    }

    @Get('refunds')
    async getAllRefunds() {
        const refunds = await this.supplierPaymentService.getAllRefunds();
        return { result: refunds, message: this.i18n.translate('Refunds.fetched', { lang: this.getLang() }) };
    }


    @Get('supplier/:supplierId')
    async getSupplierPayments(@Param('supplierId') supplierId: string) {

        const payments = await this.supplierPaymentService.findBySupplier(supplierId);
        return { result: payments, message: this.i18n.translate('payments.fetched', { lang: this.getLang() }) };
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        const payment = await this.supplierPaymentService.findById(id);
        return { result: payment, message: this.i18n.translate('payments.fetched', { lang: this.getLang() }) };
    }


}
