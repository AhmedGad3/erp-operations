import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateMaterialDto } from "./create-material.dto";
import { IsBoolean, IsOptional } from "class-validator";



export class UpdateMaterialDto extends PartialType(
    OmitType(CreateMaterialDto, ['mainCategory'] as const),
) {


    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}