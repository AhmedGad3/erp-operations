import { MongooseModule } from '@nestjs/mongoose';
import { ProjectInvoice, ProjectInvoiceSchema } from './project-invoice.schema';

export const ProjectInvoiceModel = MongooseModule.forFeature([
    { name: ProjectInvoice.name, schema: ProjectInvoiceSchema },
]);