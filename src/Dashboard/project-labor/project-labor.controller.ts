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
import { ProjectLaborService } from './project-labor.service';
import { CreateProjectLaborDto } from './dto/create-project-labor.dto';
import { UpdateProjectLaborDto } from './dto/update-project-labor.dto';
import { Auth } from '../../Common';

@Auth('admin')
@Controller('/admin/projects/:projectId/labor')
export class ProjectLaborController {
    constructor(
        private readonly projectLaborService: ProjectLaborService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Add Labor to Project
    @Auth('admin')
    @Post()
    async addLabor(
        @Param('projectId') projectId: string,
        @Body() createDto: CreateProjectLaborDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectLaborService.addLaborToProject(
            projectId,
            createDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projectLabor.created', { lang }),
        };
    }

    // ✅ Get All Labor for Project
    @Auth('admin', 'accountant', 'manager')
    @Get()
    async getProjectLabor(@Param('projectId') projectId: string) {
        const lang = this.getLang();
        const result = await this.projectLaborService.getProjectLabor(projectId);
        return {
            result,
            message: this.i18n.translate('projectLabor.fetched', { lang }),
        };
    }

    // ✅ Get Labor by Date Range
    @Auth('admin', 'accountant', 'manager')
    @Get('filter')
    async getLaborByDateRange(
        @Param('projectId') projectId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const lang = this.getLang();
        const result = await this.projectLaborService.getLaborByDateRange(
            projectId,
            startDate,
            endDate,
        );
        return {
            result,
            message: this.i18n.translate('projectLabor.fetched', { lang }),
        };
    }

    // ✅ Search by Worker Name
    @Auth('admin', 'accountant', 'manager')
    @Get('search/worker')
    async searchByWorkerName(
        @Param('projectId') projectId: string,
        @Query('name') workerName: string,
    ) {
        const lang = this.getLang();
        const result = await this.projectLaborService.searchByWorkerName(
            projectId,
            workerName,
        );
        return {
            result,
            message: this.i18n.translate('projectLabor.fetched', { lang }),
        };
    }

    // ✅ Search by Specialty
    @Auth('admin', 'accountant', 'manager')
    @Get('search/specialty')
    async searchBySpecialty(
        @Param('projectId') projectId: string,
        @Query('specialty') specialty: string,
    ) {
        const lang = this.getLang();
        const result = await this.projectLaborService.searchBySpecialty(
            projectId,
            specialty,
        );
        return {
            result,
            message: this.i18n.translate('projectLabor.fetched', { lang }),
        };
    }

    // ✅ Get Labor by ID
    @Auth('admin', 'accountant', 'manager')
    @Get(':id')
    async getLaborById(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.projectLaborService.getLaborById(id);
        return {
            result,
            message: this.i18n.translate('projectLabor.fetched', { lang }),
        };
    }

    // ✅ Update Labor
    @Auth('admin')
    @Put(':id')
    async updateLabor(
        @Param('id') id: string,
        @Body() updateDto: UpdateProjectLaborDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectLaborService.updateLabor(
            id,
            updateDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projectLabor.updated', { lang }),
        };
    }

   // ✅ Delete Labor
@Auth('admin')
@Delete(':id')
async deleteLabor(@Param('id') id: string, @Req() req: Request) {
    const lang = this.getLang();
    const result = await this.projectLaborService.deleteLabor(id, req['user']);
    return {
        result,
        message: this.i18n.translate('projectLabor.deleted', { lang }),
    };
}
}
