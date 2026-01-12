import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import { Auth } from "../../Common";
import { ProjectService } from "./project.service";
import { I18nContext, I18nService } from "nestjs-i18n";
import { CreateProjectDto, UpdateEquipmentCostsDto, UpdateLaborCostsDto, UpdateProjectDto } from "./dto";


@Auth('admin')
@Controller('admin/projects')
export class ProjectController {
constructor(
    private readonly projectService: ProjectService,
    private readonly i18n: I18nService
){}

private getLang(): string {
         return I18nContext.current()?.lang || 'ar';
     }

     @Post()
     async createProject(@Body() createDto: CreateProjectDto, @Req() req:Request){
        const lang = this.getLang();
        const result = await this.projectService.createProject(createDto, req['user']);
        return { result, message: this.i18n.translate('projects.created', { lang }) };
     }

      @Get()
    async findAllProjects() {
        const lang = this.getLang();
        const result = await this.projectService.findAll();
        return {
            result,
            message: this.i18n.translate('projects.fetched', { lang }),
        };
    }

     @Get('search')
    async searchProjects(@Query('q') searchTerm: string) {
        const lang = this.getLang();
        const result = await this.projectService.searchProjects(searchTerm);
        return {
            result,
            message: this.i18n.translate('projects.fetched', { lang }),
        };
    }

     @Get('status/:status')
    async findByStatus(@Param('status') status: string) {
        const lang = this.getLang();
        const result = await this.projectService.findByStatus(status);
        return {
            result,
            message: this.i18n.translate('projects.fetched', { lang }),
        };
    }

    @Get('client/:clientId/stats')
       async getClientStats(@Param('clientId') clientId: string) {
           const lang = this.getLang();
           const result = await this.projectService.getClientStats(clientId);
           return {
               result,
               message: this.i18n.translate('projects.statsFetched', { lang }),
           };
       }

     @Get('client/:clientId')
    async findByClient(@Param('clientId') clientId: string) {
        const lang = this.getLang();
        const result = await this.projectService.findByClient(clientId);
        return {
            result,
            message: this.i18n.translate('projects.fetched', { lang }),
        };
    }

   

   

    @Get(':id/stats')
    async getProjectStats(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.projectService.getProjectStats(id);
        return {
            result,
            message: this.i18n.translate('projects.statsFetched', { lang }),
        };
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        const lang = this.getLang();
        const result = await this.projectService.findById(id);
        return {
            result,
            message: this.i18n.translate('projects.fetched', { lang }),
        };
    }

     @Put(':id')
    async updateProject(
        @Param('id') id: string,
        @Body() updateDto: UpdateProjectDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectService.updateProject(
            id,
            updateDto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projects.updated', { lang }),
        };
    }
 @Patch(':id/equipment-costs/add')
    async addEquipmentCosts(
        @Param('id') id: string,
        @Body() dto: UpdateEquipmentCostsDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectService.updateEquipmentCosts(
            id,
            dto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projects.equipmentCostsUpdated', { lang }),
        };
    }


    @Patch(':id/labor-costs')
    async updateLaborCosts(
        @Param('id') id: string,
        @Body() dto: UpdateLaborCostsDto,
        @Req() req: Request,
    ) {
        const lang = this.getLang();
        const result = await this.projectService.updateLaborCosts(
            id,
            dto,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projects.laborCostsUpdated', { lang }),
        };
    }

    @Delete(':id')
    async deleteProject(@Param('id') id: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.projectService.deleteProject(id, req['user']);
        return {
           
            message: this.i18n.translate('projects.deleted', { lang }),
        };
    }

    @Patch(':id/activate')
    async activateProject(@Param('id') id: string, @Req() req: Request) {
        const lang = this.getLang();
        const result = await this.projectService.activateProject(
            id,
            req['user'],
        );
        return {
            result,
            message: this.i18n.translate('projects.activated', { lang }),
        };
    }
}