import { Module } from '@nestjs/common';
import { ProjectEquipmentService } from './project-equipment.service';
import { ProjectEquipmentController } from './project-equipment.controller';
import { ProjectEquipmentModel } from 'src/DB/Models/Project-Equipment/project-equipment.model';
import { AssetModel } from 'src/DB/Models/Asset/asset.model';
import { ProjectEquipmentRepository } from 'src/DB/Models/Project-Equipment/project-equipment.repository';
import { AssetRepository } from 'src/DB/Models/Asset/asset.repository';
import { ProjectModel } from './../../DB/Models/Project/project.model';
import { ProjectRepository } from 'src/DB/Models/Project/project.repository';

@Module({
    imports: [ProjectEquipmentModel, AssetModel, ProjectModel],
controllers: [ProjectEquipmentController],
    providers: [
        ProjectEquipmentRepository,
        ProjectEquipmentService,
        AssetRepository,
        ProjectRepository,
    ],
    exports: [ProjectEquipmentRepository, ProjectEquipmentService],
})
export class ProjectEquipmentModule {}