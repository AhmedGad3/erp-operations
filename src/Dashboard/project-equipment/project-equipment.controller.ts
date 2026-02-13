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
import { ProjectEquipmentService } from './project-equipment.service';
import { CreateProjectEquipmentDto } from './dto/create-project-equipment.dto';
import { UpdateProjectEquipmentDto } from './dto/update-project-equipment.dto';
import { Auth } from '../../Common';

@Auth('admin')
@Controller('/admin/projects/:projectId/equipment')
export class ProjectEquipmentController {
    constructor(
        private readonly projectEquipmentService: ProjectEquipmentService,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Add Equipment to Project
    @Post()
    async addEquipment(
        @Param('projectId') projectId: string,
        @Body() createDto: CreateProjectEquipmentDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectEquipmentService.addEquipmentToProject(
            projectId,
            createDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projectEquipment.created', { lang }),
        };
    }

    // ✅ Get All Equipment for Project
    @Get()
    async getProjectEquipment(@Param('projectId') projectId: string) {
        const lang = this.getLang();
        const result = await this.projectEquipmentService.getProjectEquipment(projectId);
        return {
            result,
            message: this.i18n.translate('projectEquipment.fetched', { lang }),
        };
    }

    // ✅ Get Equipment by Date Range
    @Get('filter')
    async getEquipmentByDateRange(
        @Param('projectId') projectId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const lang = this.getLang();
        const result = await this.projectEquipmentService.getEquipmentByDateRange(
            projectId,
            startDate,
            endDate,
        );
        return {
            result,
            message: this.i18n.translate('projectEquipment.fetched', { lang }),
        };
    }

    // ✅ Get Equipment by ID
    @Get(':id')
    async getEquipmentById(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.projectEquipmentService.getEquipmentById(id);
        return {
            result,
            message: this.i18n.translate('projectEquipment.fetched', { lang }),
        };
    }

    // ✅ Update Equipment
    @Put(':id')
    async updateEquipment(
        @Param('id') id: string,
        @Body() updateDto: UpdateProjectEquipmentDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectEquipmentService.updateEquipment(
            id,
            updateDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projectEquipment.updated', { lang }),
        };
    }

    // ✅ Delete Equipment
    // @Delete(':id')
    // async deleteEquipment(@Param('id') id: string, @Req() req: Request) {
    //     const lang = this.getLang();
    //     const result = await this.projectEquipmentService.deleteEquipment(id, req['user']);
    //     return {
    //         result,
    //         message: this.i18n.translate('projectEquipment.deleted', { lang }),
    //     };
    // }
}