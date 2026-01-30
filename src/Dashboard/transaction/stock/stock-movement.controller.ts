import { Body, Controller, Post, Req } from "@nestjs/common";
import { I18nContext, I18nService } from "nestjs-i18n";
import { Auth } from "../../../Common";
import { StockMovementService } from "./stock-movement.service";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";

@Auth('admin')
@Controller('admin/stock-movement')
export class StockMovementController {
    constructor(
          private readonly stockMovementService: StockMovementService,
                private readonly i18n: I18nService,
    ){}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

@Post('adjustment')
async createAdjustment(
    @Body() dto: CreateAdjustmentDto,
    @Req() req: Request,
) {
    const lang = this.getLang();
    const result = await this.stockMovementService.createAdjustments({
        adjustments: dto.adjustments,
        createdBy: req['user']._id,
    });
    return {
        result,
        message: this.i18n.translate('stock.adjustmentCreated', { lang }),
    };
}
}
