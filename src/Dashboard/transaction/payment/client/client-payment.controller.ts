import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
} from '@nestjs/common';
import { Auth } from 'src/Common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreateClientPaymentDto } from './dto/create-client-payment.dto';
import { ClientPaymentService } from './client.payment.service';

@Auth('admin')
@Controller('admin/projects/payments')
export class ClientPaymentController {
    constructor(
        private readonly clientPaymentService: ClientPaymentService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Post()
    async createPayment(
        @Body() dto: CreateClientPaymentDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.clientPaymentService.createClientPayment(
            dto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('clientPayment.created', { lang }),
        };
    }

    @Get()
    async findAll() {
        const lang = this.getLang();
        const result = await this.clientPaymentService.findAll();
        return {
            result,
            message: this.i18n.translate('clientPayment.fetched', { lang }),
        };
    }

    @Get('project/:projectId')
    async findByProject(@Param('projectId') projectId: string) {
        const lang = this.getLang();
        const result = await this.clientPaymentService.findByProject(projectId);
        return {
            result,
            message: this.i18n.translate('clientPayment.fetched', { lang }),
        };
    }

    @Get('client/:clientId')
    async findByClient(@Param('clientId') clientId: string) {
        const lang = this.getLang();
        const result = await this.clientPaymentService.findByClient(clientId);
        return {
            result,
            message: this.i18n.translate('clientPayment.fetched', { lang }),
        };
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.clientPaymentService.findById(id);
        return {
            result,
            message: this.i18n.translate('clientPayment.fetched', { lang }),
        };
    }
}