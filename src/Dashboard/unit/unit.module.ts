import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Unit, UnitSchema } from "../../DB/Models/Unit/unit.schema";
import { UnitController } from "./unit.controller";
import { UnitService } from "./unit.service";
import { UnitRepository } from "../../DB/Models/Unit/unit.repository";


@Module({
    imports: [
        MongooseModule.forFeature([{name : Unit.name, schema: UnitSchema}]),
    ],
    controllers:[UnitController],
    providers:[UnitService, UnitRepository],
    exports:[UnitService],
})

export class UnitModule{}


