import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreateProjectEquipmentDto } from './dto/create-project-equipment.dto';
import { UpdateProjectEquipmentDto } from './dto/update-project-equipment.dto';
import { TUser } from '../../DB';
import { ProjectRepository } from '../../DB/Models/Project/project.repository';
import { ProjectEquipmentRepository } from 'src/DB/Models/Project-Equipment/project-equipment.repository';
import { AssetRepository } from 'src/DB/Models/Asset/asset.repository';
import { EquipmentSource, TProjectEquipment } from 'src/DB/Models/Project-Equipment/project-equipment.schema';

@Injectable()
export class ProjectEquipmentService {
    constructor(
        private readonly projectEquipmentRepository: ProjectEquipmentRepository,
        private readonly assetRepository: AssetRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly i18n: I18nService,
    ) {}

    private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    // ✅ Add Equipment to Project
    async addEquipmentToProject(
        projectId: string,
        createDto: CreateProjectEquipmentDto,
        user: TUser,
    ): Promise<TProjectEquipment> {
        const lang = this.getLang();

        // Validate Project
        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundException(
                this.i18n.translate('projects.errors.notFound', { lang }),
            );
        }

        // Validate Asset if COMPANY_ASSET
        if (createDto.equipmentSource === EquipmentSource.COMPANY_ASSET) {
            if (!createDto.assetId) {
                throw new BadRequestException(
                    this.i18n.translate('projectEquipment.errors.assetIdRequired', { lang }),
                );
            }

            const asset = await this.assetRepository.findById(createDto.assetId);
            if (!asset) {
                throw new NotFoundException(
                    this.i18n.translate('assets.errors.notFound', { lang }),
                );
            }

            // Check if asset is available
            if (asset.status !== 'AVAILABLE') {
                throw new ConflictException(
                    this.i18n.translate('projectEquipment.errors.assetNotAvailable', { lang }),
                );
            }

            // Update asset status to IN_USE
            await this.assetRepository.updateStatus(
                createDto.assetId,
                'IN_USE',
                user._id as Types.ObjectId,
            );
        } else {
            // EXTERNAL_RENTAL
            if (!createDto.equipmentName) {
                throw new BadRequestException(
                    this.i18n.translate('projectEquipment.errors.equipmentNameRequired', { lang }),
                );
            }
        }

        // Calculate costs
        const rentalCost = createDto.numberOfDays * createDto.dailyRentalRate;
        
        const fuelCost = createDto.fuelCost || 0;
        const operatorCost = createDto.operatorCost || 0;
        const maintenanceCost = createDto.maintenanceCost || 0;
        const otherOperatingCost = createDto.otherOperatingCost || 0;
        
        const totalOperatingCost = fuelCost + operatorCost + maintenanceCost + otherOperatingCost;
        const totalCost = rentalCost + totalOperatingCost;

        // Create equipment record
        const equipmentData: any = {
            projectId: new Types.ObjectId(projectId),
            equipmentSource: createDto.equipmentSource,
            numberOfDays: createDto.numberOfDays,
            dailyRentalRate: createDto.dailyRentalRate,
            rentalCost,
            fuelCost,
            operatorCost,
            maintenanceCost,
            otherOperatingCost,
            totalOperatingCost,
            totalCost,
            startDate: new Date(createDto.startDate),
            endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
            notes: createDto.notes || '',
            createdBy: user._id as Types.ObjectId,
        };

        if (createDto.equipmentSource === EquipmentSource.COMPANY_ASSET) {
            equipmentData.assetId = new Types.ObjectId(createDto.assetId!);
        } else {
            equipmentData.equipmentName = createDto.equipmentName;
            equipmentData.supplierName = createDto.supplierName || '';
        }

        const equipment = await this.projectEquipmentRepository.create(equipmentData);

        // Update project equipmentCosts
        await this.updateProjectEquipmentCosts(projectId);

        return equipment;
    }

    // ✅ Get All Equipment for Project
    async getProjectEquipment(projectId: string): Promise<TProjectEquipment[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectEquipmentRepository.findByProjectId(projectId);
    }

    // ✅ Get Equipment by ID
    async getEquipmentById(id: string): Promise<TProjectEquipment> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
                this.i18n.translate('projectEquipment.errors.invalidId', { lang }),
            );
        }

        const equipment = await this.projectEquipmentRepository.findByIdWithPopulate(id);
        if (!equipment) {
            throw new NotFoundException(
                this.i18n.translate('projectEquipment.errors.notFound', { lang }),
            );
        }

        return equipment;
    }

    // ✅ Update Equipment
    async updateEquipment(
        id: string,
        updateDto: UpdateProjectEquipmentDto,
        user: TUser,
    ): Promise<TProjectEquipment> {
        const lang = this.getLang();

        const equipment = await this.getEquipmentById(id);

        // Recalculate costs if needed
        const numberOfDays = updateDto.numberOfDays ?? equipment.numberOfDays;
        const dailyRentalRate = updateDto.dailyRentalRate ?? equipment.dailyRentalRate;
        const rentalCost = numberOfDays * dailyRentalRate;

        const fuelCost = updateDto.fuelCost ?? equipment.fuelCost;
        const operatorCost = updateDto.operatorCost ?? equipment.operatorCost;
        const maintenanceCost = updateDto.maintenanceCost ?? equipment.maintenanceCost;
        const otherOperatingCost = updateDto.otherOperatingCost ?? equipment.otherOperatingCost;

        const totalOperatingCost = fuelCost + operatorCost + maintenanceCost + otherOperatingCost;
        const totalCost = rentalCost + totalOperatingCost;

        const updateData: any = {
            ...updateDto,
            rentalCost,
            totalOperatingCost,
            totalCost,
            updatedBy: user._id as Types.ObjectId,
        };

        if (updateDto.startDate) {
            updateData.startDate = new Date(updateDto.startDate);
        }
        if (updateDto.endDate) {
            updateData.endDate = new Date(updateDto.endDate);
        }

        Object.assign(equipment, updateData);
        await equipment.save();

        // Update project equipmentCosts
        await this.updateProjectEquipmentCosts(equipment.projectId.toString());

        return equipment;
    }

    // ✅ Delete Equipment (and free asset if COMPANY_ASSET)
    async deleteEquipment(id: string, user: TUser): Promise<TProjectEquipment> {
        const lang = this.getLang();

        const equipment = await this.getEquipmentById(id);

        if (!equipment.isActive) {
            throw new NotFoundException(
                this.i18n.translate('projectEquipment.errors.notFound', { lang }),
            );
        }

        // If COMPANY_ASSET, return asset to AVAILABLE
        if (equipment.equipmentSource === EquipmentSource.COMPANY_ASSET && equipment.assetId) {
            await this.assetRepository.updateStatus(
                equipment.assetId.toString(),
                'AVAILABLE',
                user._id as Types.ObjectId,
            );
        }

        const result = await this.projectEquipmentRepository.deactivate(
            id,
            user._id as Types.ObjectId,
        );

        // Update project equipmentCosts
        await this.updateProjectEquipmentCosts(equipment.projectId.toString());

        return result!;
    }

    // ✅ Get Equipment by Date Range
    async getEquipmentByDateRange(
        projectId: string,
        startDate: string,
        endDate: string,
    ): Promise<TProjectEquipment[]> {
        const lang = this.getLang();

        if (!Types.ObjectId.isValid(projectId)) {
            throw new BadRequestException(
                this.i18n.translate('projects.errors.invalidId', { lang }),
            );
        }

        return this.projectEquipmentRepository.findByDateRange(
            projectId,
            new Date(startDate),
            new Date(endDate),
        );
    }

    // ✅ Update Project Equipment Costs
   private async updateProjectEquipmentCosts(projectId: string): Promise<void> {
    const totalCost = await this.projectEquipmentRepository.calculateTotalCostByProject(projectId);
    
    const project = await this.projectRepository.findById(projectId);
    if (!project) return;

    project.equipmentCosts = totalCost;
    
    // Recalculate total costs
    project.totalCosts =
        project.materialCosts +
        project.laborCosts +
        project.equipmentCosts +
        project.otherCosts;

    await project.save();
}
}