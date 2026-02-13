import { Module } from '@nestjs/common';
import { ProjectMiscellaneousService } from './project-miscellaneous.service';
import { ProjectMiscellaneousController } from './project-miscellaneous.controller';
import { ProjectMiscellaneousModel } from 'src/DB/Models/project-miscellaneous/project-miscellaneous.model';
import { ProjectModel } from 'src/DB/Models/Project/project.model';
import { ProjectMiscellaneousRepository } from 'src/DB/Models/project-miscellaneous/project-miscellaneous.repository';
import { ProjectRepository } from 'src/DB/Models/Project/project.repository';

@Module({
    imports: [ProjectMiscellaneousModel, ProjectModel],
    controllers: [ProjectMiscellaneousController],
    providers: [
        ProjectMiscellaneousRepository,
        ProjectMiscellaneousService,
        ProjectRepository,
    ],
    exports: [ProjectMiscellaneousRepository, ProjectMiscellaneousService],
})
export class ProjectMiscellaneousModule {}