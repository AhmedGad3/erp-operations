import { Controller, Get, Query, Param } from '@nestjs/common';
import { Auth } from '../../../Common';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { SupplierStatementService } from './supplier-statement.service';
import { SupplierStatementDto } from './dto';

@Auth('admin')
@Controller('admin/reports/supplier-statement')
export class SupplierStatementController {
    constructor(
        private readonly statementService: SupplierStatementService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Get(':supplierId')
    async getSupplierStatement(
        @Param('supplierId') supplierId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const lang = this.getLang();

        const dto: SupplierStatementDto = {
            supplierId,
            startDate,
            endDate,
        };

        const result = await this.statementService.generateStatement(dto);

        return {
            result,
            message: this.i18n.translate('reports.supplierStatement.generated', {
                lang,
            }),
        };
    }

    @Get()
    async getAllSuppliersStatement(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const lang = this.getLang();

        const result = await this.statementService.generateAllSuppliersStatement(
            startDate,
            endDate,
        );

        return {
            result,
            message: this.i18n.translate('reports.suppliersStatement.generated', {
                lang,
            }),
        };
    }
}
