// subcontractor-work.model.ts

import { MongooseModule } from '@nestjs/mongoose';
import { SubcontractorWork, SubcontractorWorkSchema } from './subcontractor-work.schema';

export const SubcontractorWorkModel = MongooseModule.forFeature([
    {
        name: SubcontractorWork.name,
        schema: SubcontractorWorkSchema,
    },
]);