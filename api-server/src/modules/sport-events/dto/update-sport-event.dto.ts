import { PartialType } from "@nestjs/swagger";
import { CreateSportEventDto } from "./create-sport-event.dto";

export class UpdateSportEventDto extends PartialType(CreateSportEventDto) {}
