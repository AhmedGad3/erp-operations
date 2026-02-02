import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { I18nContext, I18nService } from "nestjs-i18n";
import { ClientRepository } from "../../DB/Models/Client/client.repository";
import { ProjectRepository } from "../../DB/Models/Project/project.repository";
import { CreateProjectDto, UpdateEquipmentCostsDto, UpdateLaborCostsDto, UpdateProjectDto } from "./dto";
import { TUser } from "../../DB";
import { Model, Types } from "mongoose";
import { Project, ProjectStatus, TProject } from "../../DB/Models/Project/project.schema";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class ProjectService {
    constructor(
        @InjectModel(Project.name)
        private projectModel: Model<TProject>,
        private readonly projectRepository: ProjectRepository,
        private readonly clientRepository: ClientRepository,
        private readonly i18n: I18nService
    ){}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

 async createProject(createDto: CreateProjectDto, user: TUser) {
    const lang = this.getLang();

    const client = await this.clientRepository.findById(createDto.clientId);
    if (!client || !client.isActive) {
        throw new NotFoundException(
            this.i18n.translate('clients.errors.notFound', { lang }),
        );
    }

    const codeExists = await this.projectRepository.findByCode(createDto.code);
    if (codeExists) {
        throw new BadRequestException(
            this.i18n.translate('projects.errors.codeExists', {
                lang,
                args: { code: createDto.code },
            }),
        );
    }

    // ===== snapshot العمالة =====
    let laborDetails: {
        numberOfWorkers: number;
        monthlyCost: number;
        notes?: string;
    } | undefined = undefined; // 👈 undefined لو مفيش بيانات

    let laborCosts = 0;

    if (createDto.laborDetails) {
        laborDetails = {
            numberOfWorkers: createDto.laborDetails.numberOfWorkers,
            monthlyCost: createDto.laborDetails.monthlyCost,
            notes: createDto.laborDetails.notes,
        };

        const months = createDto.laborMonths || 0;
        
        // حساب التكلفة الفعلية للعمالة عند الإنشاء
        laborCosts =
            createDto.laborDetails.numberOfWorkers *
            createDto.laborDetails.monthlyCost *
            months;
    }

    const otherCosts = createDto.otherCosts || 0;
    const totalCosts = laborCosts + otherCosts;

    const project = await this.projectRepository.create({
        ...createDto,
        code: createDto.code.toUpperCase(),
        clientId: new Types.ObjectId(createDto.clientId),
        startDate: new Date(createDto.startDate),
        expectedEndDate: createDto.expectedEndDate
            ? new Date(createDto.expectedEndDate)
            : undefined,
        laborDetails,  // snapshot فقط
        laborCosts,    // التراكمي
        otherCosts,
        totalCosts,
        createdBy: user._id as Types.ObjectId,
    });

    return project;
}



      async findAll(): Promise<TProject[] | null> {
        return this.projectRepository.find();
    }

    async findById(id: string): Promise<TProject> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        const project = await this.projectRepository.findById(id);
        if (!project || !project.isActive) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        return project;
    }

      async findByClient(clientId: string): Promise<TProject[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(clientId)) {
            throw new BadRequestException(
                this.i18n.translate('clients.errors.invalidId', { lang }),
            );
        }

        return this.projectRepository.findByClientId(clientId);
    }

    async findByStatus(status: string): Promise<TProject[]> {
        return this.projectRepository.findByStatus(status as any);
    }

    async searchProjects(searchTerm: string): Promise<TProject[]> {
        return this.projectRepository.searchProjects(searchTerm);
    }

async updateProject(
    id: string,
    updateDto: UpdateProjectDto,
    user: TUser,
): Promise<TProject> {
    const lang = this.getLang();

    const project = await this.projectRepository.findById(id);
    if (!project || !project.isActive) {
        throw new NotFoundException(
            this.i18n.translate('projects.errors.notFound', { lang }),
        );
    }

    // ✅ Update only provided fields
    if (updateDto.nameAr) project.nameAr = updateDto.nameAr;
    if (updateDto.nameEn) project.nameEn = updateDto.nameEn;
    if (updateDto.projectManager !== undefined) project.projectManager = updateDto.projectManager;
    if (updateDto.siteEngineer !== undefined) project.siteEngineer = updateDto.siteEngineer;
    if (updateDto.status) project.status = updateDto.status;
    if (updateDto.notes !== undefined) project.notes = updateDto.notes;
    project.updatedBy = user._id as Types.ObjectId;

    return project.save();
}

 async updateEquipmentCosts(
    id: string,
    dto: UpdateEquipmentCostsDto,
    user: TUser,
): Promise<TProject> {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(
            this.i18n.translate('projects.errors.invalidId', { lang }),
        );
    }

    const project = await this.projectRepository.findById(id);
    if (!project || !project.isActive) {
        throw new NotFoundException(
            this.i18n.translate('projects.errors.notFound', { lang }),
        );
    }

    // ✅ overwrite مش +=
    project.equipmentCosts = dto.amount;

    project.totalCosts =
        project.materialCosts +
        project.laborCosts +
        project.equipmentCosts +
        project.otherCosts;

    if (dto.notes) {
        project.notes = project.notes
            ? project.notes + ' | ' + dto.notes
            : dto.notes;
    }

    project.updatedBy = user._id as Types.ObjectId;

    return project.save();
}


async updateLaborCosts(
    id: string,
    dto: UpdateLaborCostsDto,
    user: TUser,
): Promise<TProject> {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(
            this.i18n.translate('projects.errors.invalidId', { lang }),
        );
    }

    const project = await this.projectRepository.findById(id);
    if (!project || !project.isActive) {
        throw new NotFoundException(
            this.i18n.translate('projects.errors.notFound', { lang }),
        );
    }

    // ===== حساب التكلفة الجديدة (اللي هنضيفها) =====
    const addedLaborCost =
        dto.laborDetails.numberOfWorkers *
        dto.laborDetails.monthlyCost *
        dto.numberOfMonths; // 👈 من برة مش من جوة laborDetails

    // ===== تحديث تراكمي =====
    project.laborCosts += addedLaborCost;

    // ===== تحديث الـ snapshot بآخر أرقام =====
    project.laborDetails = {
        numberOfWorkers: dto.laborDetails.numberOfWorkers,
        monthlyCost: dto.laborDetails.monthlyCost,
        notes: dto.laborDetails.notes,
    };

    // ===== إعادة حساب التكلفة الإجمالية =====
    project.totalCosts =
        project.materialCosts +
        project.laborCosts +
        project.equipmentCosts +
        project.otherCosts;

    project.updatedBy = user._id as Types.ObjectId;

    return project.save();
}




async deleteProject(id: string, user: TUser): Promise<TProject> {
        const lang = this.getLang();

        const project = await this.projectRepository.findById(id);
        if (!project || !project.isActive) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        if(project.status === ProjectStatus.ON_HOLD || project.status === ProjectStatus.IN_PROGRESS){
            
        
            throw new BadRequestException(
                this.i18n.translate('projects.errors.cannotDelete', { lang }),
            );
        }

        project.isActive = false;
        project.updatedBy = user._id as Types.ObjectId;
        await project.save();

        return project;
    }


     async activateProject(id: string, user: TUser): Promise<TProject> {
        const lang = this.getLang();

        const project = await this.projectRepository.findById(id);
        if (!project) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        if (project.isActive) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.alreadyActive', { lang }),
            );
        }

        project.isActive = true;
        project.updatedBy = user._id as Types.ObjectId;
        await project.save();

        return project;
    }



      async getProjectStats(id: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        const stats = await this.projectRepository.getProjectStats(id);
        if (!stats) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        return stats;
    }

    async getClientStats(clientId: string) {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(clientId)) {
            throw new BadRequestException(
                this.i18n.translate('clients.errors.invalidId', { lang }),
            );
        }

        return this.projectRepository.getClientStats(clientId);
    }

    


} 