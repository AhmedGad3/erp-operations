import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectModel } from '../../DB/Models/Project/project.model';
import { ProjectRepository } from '../../DB/Models/Project/project.repository';
import { ClientModel } from '../../DB/Models/Client/client.model';
import { ClientRepository } from '../../DB/Models/Client/client.repository';
import { CommonModule } from '../transaction/common/common.module';

@Module({
    imports: [ProjectModel, ClientModel, CommonModule],
    controllers: [ProjectController],
    providers: [ProjectService, ProjectRepository, ClientRepository],
    exports: [ProjectService, ProjectRepository],
})
export class ProjectModule {}
