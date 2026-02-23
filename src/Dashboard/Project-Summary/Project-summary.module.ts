import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';


import { Project, ProjectSchema } from '../../DB/Models/Project/project.schema';
import { ProjectEquipment, ProjectEquipmentSchema } from '../../DB/Models/Project-Equipment/project-equipment.schema';
import { SubcontractorWork, SubcontractorWorkSchema } from '../../DB/Models/Subcontractor-Work/subcontractor-work.schema';
import { MaterialIssue, MaterialIssueSchema } from '../../DB/Models/Transaction/project/material-issue.schema';
import { ProjectLabor, ProjectLaborSchema } from 'src/DB/Models/ProjectLabor/project-labor.schema';
import { ProjectMiscellaneous, ProjectMiscellaneousSchema } from 'src/DB/Models/project-miscellaneous/project-miscellaneous.schema';
import { ProjectSummaryController } from './Project-summary.controller';
import { ProjectSummaryService } from './Project-summary.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: ProjectLabor.name, schema: ProjectLaborSchema },
            { name: ProjectEquipment.name, schema: ProjectEquipmentSchema },
            { name: ProjectMiscellaneous.name, schema: ProjectMiscellaneousSchema },
            { name: SubcontractorWork.name, schema: SubcontractorWorkSchema },
            { name: MaterialIssue.name, schema: MaterialIssueSchema },
        ]),
    ],
    controllers: [ProjectSummaryController],
    providers: [ProjectSummaryService],
    exports: [ProjectSummaryService],
})
export class ProjectSummaryModule {}