import { MongooseModule } from "@nestjs/mongoose";
import { Project, ProjectSchema } from "./project.schema";


export const ProjectModel = MongooseModule.forFeature([{
    name: Project.name,
    schema: ProjectSchema
}])