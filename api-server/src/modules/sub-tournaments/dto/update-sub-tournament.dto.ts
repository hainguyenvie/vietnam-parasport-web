import { PartialType } from "@nestjs/swagger";
import { CreateSubTournamentDto } from "./create-sub-tournament.dto";

export class UpdateSubTournamentDto extends PartialType(CreateSubTournamentDto) {}
