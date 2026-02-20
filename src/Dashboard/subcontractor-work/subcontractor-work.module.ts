// subcontractor-work.module.ts

import { Module } from '@nestjs/common';
import { SubcontractorWorkService } from './subcontractor-work.service';
import { SubcontractorWorkController } from './subcontractor-work.controller';
import { ProjectModel } from '../../DB/Models/Project/project.model';
import { ProjectRepository } from 'src/DB/Models/Project/project.repository';
import { SubcontractorWorkModel } from 'src/DB/Models/Subcontractor-Work/subcontractor-work.model';
import { SubcontractorWorkRepository } from 'src/DB/Models/Subcontractor-Work/subcontractor-work.repository';

@Module({
    imports: [SubcontractorWorkModel, ProjectModel],
    controllers: [SubcontractorWorkController],
    providers: [SubcontractorWorkRepository, SubcontractorWorkService, ProjectRepository],
    exports: [SubcontractorWorkRepository, SubcontractorWorkService],
})
export class SubcontractorWorkModule {}