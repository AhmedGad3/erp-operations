import { Controller, Get, Param } from "@nestjs/common";
import { Auth } from "../../../../Common";
import { SupplierLedgerService } from "./supplier-ledger.service";
import { I18nContext, I18nService } from "nestjs-i18n";
import { Types } from "mongoose";

@Auth('admin')
@Controller('/admin/ledger/supplier')
export class SupplierLedgerController {
    constructor(
        private readonly ledgerService: SupplierLedgerService,
        private readonly i18n: I18nService,
    ) { }

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Get()
    async getAllLedger() {
        const result = await this.ledgerService.findAll();
        return {
            result,
            message: this.i18n.translate('ledger.fetched', {
                lang: this.getLang(),
            }),
        };
    }

    @Get(':supplierId')
    async getLedgerBySupplier(@Param('supplierId') supplierId: string) {
        const result = await this.ledgerService.findBySupplier(
            (supplierId),


        );

        return {
            result,
            message: this.i18n.translate('ledger.bySupplierFetched', {
                lang: this.getLang(),
            }),
        };
    }

    @Get(':supplierId/balance')
    async getSupplierBalance(@Param('supplierId') supplierId: Types.ObjectId) {
        const amountDue = await this.ledgerService.getCurrentBalance(
            (supplierId),
        );

        return {
            result: { amountDue },
            message: this.i18n.translate('ledger.balanceFetched', {
                lang: this.getLang(),
            }),
        };
    }
}
