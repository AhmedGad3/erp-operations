import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectModel } from 'src/DB/Models/Project/project.model';
import { ProjectRepository } from 'src/DB/Models/Project/project.repository';
import { ClientModel } from 'src/DB/Models/Client/client.model';
import { ClientRepository } from 'src/DB/Models/Client/client.repository';

@Module({
    imports: [ProjectModel, ClientModel],
    controllers: [ProjectController],
    providers: [ProjectService, ProjectRepository, ClientRepository],
    exports: [ProjectService, ProjectRepository],
})
export class ProjectModule {}