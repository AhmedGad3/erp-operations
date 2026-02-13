import { MongooseModule } from '@nestjs/mongoose';
import { ProjectMiscellaneous, ProjectMiscellaneousSchema } from './project-miscellaneous.schema';

export const ProjectMiscellaneousModel = MongooseModule.forFeature([
    { name: ProjectMiscellaneous.name, schema: ProjectMiscellaneousSchema },
]);