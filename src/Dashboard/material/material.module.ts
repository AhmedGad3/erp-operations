import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Material, MaterialSchema } from "../../DB/Models/Material/material.schema";
import { MaterialController } from "./material.controller";
import { UnitService } from "../unit/unit.service";
import { MaterialRepository } from "../../DB/Models/Material/material.repository";
import { MaterialService } from "./material.service";
import { UnitModel, UnitRepository } from "../../DB";
import { I18nService } from "nestjs-i18n";



@Module({
    imports: [
        MongooseModule.forFeature([{
            name: Material.name,
            schema: MaterialSchema
        }]),
        UnitModel
    ],
    controllers: [MaterialController],
    providers: [UnitService, UnitRepository, MaterialService, MaterialRepository],
    exports: []
})

export class MaterialModule { }