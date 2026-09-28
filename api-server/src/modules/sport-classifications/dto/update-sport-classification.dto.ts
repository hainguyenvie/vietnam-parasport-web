import { PartialType } from "@nestjs/swagger";
import { CreateSportClassificationDto } from "./create-sport-classification.dto";

export class UpdateSportClassificationDto extends PartialType(CreateSportClassificationDto) {}
