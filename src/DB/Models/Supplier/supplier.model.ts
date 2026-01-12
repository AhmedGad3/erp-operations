import { MongooseModule } from "@nestjs/mongoose";
import { Supplier, SupplierSchema } from './supplier.schema';


export const supplierModel = MongooseModule.forFeature([{
    name: Supplier.name,
    schema: SupplierSchema
}])