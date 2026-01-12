
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
import { CreateMaterialIssueDto } from './dto/create-material-issue.dto';
import { MaterialIssueService } from './transfer-orders.service';

@Auth('admin')
@Controller('admin/projects/material-issue')
export class MaterialIssueController {
    constructor(
        private readonly materialIssueService: MaterialIssueService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    @Post()
    async createMaterialIssue(
        @Body() dto: CreateMaterialIssueDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.materialIssueService.createMaterialIssue(
            dto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('materialIssue.created', { lang }),
        };
    }

    @Get()
    async findAll() {
        const lang = this.getLang();
        const result = await this.materialIssueService.findAll();
        return {
            result,
            message: this.i18n.translate('materialIssue.fetched', { lang }),
        };
    }

    @Get('project/:projectId')
    async findByProject(@Param('projectId') projectId: string) {
        const lang = this.getLang();
        const result = await this.materialIssueService.findByProject(projectId);
        return {
            result,
            message: this.i18n.translate('materialIssue.fetched', { lang }),
        };
    }

    @Get('client/:clientId')
    async findByClient(@Param('clientId') clientId: string) {
        const lang = this.getLang();
        const result = await this.materialIssueService.findByClient(clientId);
        return {
            result,
            message: this.i18n.translate('materialIssue.fetched', { lang }),
        };
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.materialIssueService.findById(id);
        return {
            result,
            message: this.i18n.translate('materialIssue.fetched', { lang }),
        };
    }
}