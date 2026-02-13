import { MongooseModule } from '@nestjs/mongoose';
import { ProjectLabor, ProjectLaborSchema } from './project-labor.schema';

export const ProjectLaborModel = MongooseModule.forFeature([
    { name: ProjectLabor.name, schema: ProjectLaborSchema },
]);