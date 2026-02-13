import { Module } from '@nestjs/common';
import { ProjectLaborService } from './project-labor.service';
import { ProjectLaborController } from './project-labor.controller';
import { ProjectModel } from '../../DB/Models/Project/project.model';
import { ProjectLaborModel } from 'src/DB/Models/ProjectLabor/project-labor.model';
import { ProjectRepository } from 'src/DB/Models/Project/project.repository';
import { ProjectLaborRepository } from 'src/DB/Models/ProjectLabor/project-labor.repository';

@Module({
    imports: [ProjectLaborModel, ProjectModel],
    controllers: [ProjectLaborController],
    providers: [ProjectLaborRepository, ProjectLaborService, ProjectRepository],
    exports: [ProjectLaborRepository, ProjectLaborService],
})
export class ProjectLaborModule {}