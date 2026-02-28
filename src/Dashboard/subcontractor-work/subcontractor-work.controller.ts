// subcontractor-work.controller.ts

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { SubcontractorWorkService } from './subcontractor-work.service';
import { CreateSubcontractorWorkDto } from './dto/create-subcontractor-work.dto';
import { UpdateSubcontractorWorkDto } from './dto/update-subcontractor-work.dto';
import { Auth } from '../../Common';

@Auth('admin')
@Controller('/admin/projects/:projectId/subcontractor-work')
export class SubcontractorWorkController {
    constructor(
        private readonly subcontractorWorkService: SubcontractorWorkService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Add Work to Project
    @Auth('admin')
    @Post()
    async addWork(
        @Param('projectId') projectId: string,
        @Body() createDto: CreateSubcontractorWorkDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.subcontractorWorkService.addWorkToProject(
            projectId,
            createDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('subcontractorWork.created', { lang }),
        };
    }

    // ✅ Get All Works for Project
    @Auth('admin', 'accountant', 'manager')
    @Get()
    async getProjectWorks(@Param('projectId') projectId: string) {
        const lang = this.getLang();
        const result = await this.subcontractorWorkService.getProjectWorks(projectId);
        return {
            result,
            message: this.i18n.translate('subcontractorWork.fetched', { lang }),
        };
    }

    // ✅ Search
    @Auth('admin', 'accountant', 'manager')
    @Get('search')
    async searchWorks(
        @Param('projectId') projectId: string,
        @Query('q') searchTerm: string,
    ) {
        const lang = this.getLang();
        const result = await this.subcontractorWorkService.searchWorks(projectId, searchTerm);
        return {
            result,
            message: this.i18n.translate('subcontractorWork.fetched', { lang }),
        };
    }

    // ✅ Get Work by ID
    @Auth('admin', 'accountant', 'manager')
    @Get(':id')
    async getWorkById(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.subcontractorWorkService.getWorkById(id);
        return {
            result,
            message: this.i18n.translate('subcontractorWork.fetched', { lang }),
        };
    }

    // ✅ Update Work
    @Auth('admin')
    @Put(':id')
    async updateWork(
        @Param('id') id: string,
        @Body() updateDto: UpdateSubcontractorWorkDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.subcontractorWorkService.updateWork(
            id,
            updateDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('subcontractorWork.updated', { lang }),
        };
    }

    // ✅ Delete Work
    @Auth('admin')
    @Delete(':id')
    async deleteWork(@Param('id') id: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.subcontractorWorkService.deleteWork(id, req['user']);
        return {
            result,
            message: this.i18n.translate('subcontractorWork.deleted', { lang }),
        };
    }
}
