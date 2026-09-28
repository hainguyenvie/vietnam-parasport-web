import { IsBoolean, IsNotEmpty } from "class-validator";

export class CheckInTournamentDto {
  @IsBoolean()
  @IsNotEmpty()
  hasCheckedIn: boolean;
}
