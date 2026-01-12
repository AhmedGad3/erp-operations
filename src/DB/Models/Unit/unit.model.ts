import { MongooseModule } from "@nestjs/mongoose";
import { Unit, UnitSchema } from "./unit.schema";


export const UnitModel = MongooseModule.forFeature([
    {name: Unit.name, schema: UnitSchema},
]);