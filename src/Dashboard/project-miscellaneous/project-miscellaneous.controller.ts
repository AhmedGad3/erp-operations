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
import { ProjectMiscellaneousService } from './project-miscellaneous.service';
import { CreateProjectMiscellaneousDto } from './dto/create-project-miscellaneous.dto';
import { UpdateProjectMiscellaneousDto } from './dto/update-project-miscellaneous.dto';
import { Auth } from '../../Common';

@Auth('admin')
@Controller('/admin/projects/:projectId/miscellaneous')
export class ProjectMiscellaneousController {
    constructor(
        private readonly projectMiscellaneousService: ProjectMiscellaneousService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Add Miscellaneous to Project
    @Auth('admin')
    @Post()
    async addMiscellaneous(
        @Param('projectId') projectId: string,
        @Body() createDto: CreateProjectMiscellaneousDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.addMiscellaneousToProject(
            projectId,
            createDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.created', { lang }),
        };
    }

    // ✅ Get All Miscellaneous for Project
    @Auth('admin', 'accountant', 'manager')
    @Get()
    async getProjectMiscellaneous(@Param('projectId') projectId: string) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.getProjectMiscellaneous(projectId);
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.fetched', { lang }),
        };
    }

    // ✅ Get All Categories for Project
    @Auth('admin', 'accountant', 'manager')
    @Get('categories')
    async getProjectCategories(@Param('projectId') projectId: string) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.getProjectCategories(projectId);
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.fetched', { lang }),
        };
    }

    // ✅ Get Miscellaneous by Date Range
    @Auth('admin', 'accountant', 'manager')
    @Get('filter')
    async getMiscellaneousByDateRange(
        @Param('projectId') projectId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.getMiscellaneousByDateRange(
            projectId,
            startDate,
            endDate,
        );
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.fetched', { lang }),
        };
    }

    // ✅ Search by Category
    @Auth('admin', 'accountant', 'manager')
    @Get('search/category')
    async searchByCategory(
        @Param('projectId') projectId: string,
        @Query('category') category: string,
    ) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.searchByCategory(
            projectId,
            category,
        );
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.fetched', { lang }),
        };
    }

    // ✅ Get Miscellaneous by ID
    @Auth('admin', 'accountant', 'manager')
    @Get(':id')
    async getMiscellaneousById(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.getMiscellaneousById(id);
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.fetched', { lang }),
        };
    }

    // ✅ Update Miscellaneous
    @Auth('admin')
    @Put(':id')
    async updateMiscellaneous(
        @Param('id') id: string,
        @Body() updateDto: UpdateProjectMiscellaneousDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.updateMiscellaneous(
            id,
            updateDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.updated', { lang }),
        };
    }

    // ✅ Delete Miscellaneous
    @Auth('admin')
    @Delete(':id')
    async deleteMiscellaneous(@Param('id') id: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.projectMiscellaneousService.deleteMiscellaneous(id, req['user']);
        return {
            result,
            message: this.i18n.translate('projectMiscellaneous.deleted', { lang }),
        };
    }
}
