import { MongooseModule } from '@nestjs/mongoose';
import { ProjectEquipment, ProjectEquipmentSchema } from './project-equipment.schema';

export const ProjectEquipmentModel = MongooseModule.forFeature([
    { name: ProjectEquipment.name, schema: ProjectEquipmentSchema },
]);