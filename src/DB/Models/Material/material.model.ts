import { MongooseModule } from "@nestjs/mongoose";
import { Material, MaterialSchema } from "./material.schema";


export const MaterialModel = MongooseModule.forFeature([{
    name: Material.name,
    schema: MaterialSchema
}])