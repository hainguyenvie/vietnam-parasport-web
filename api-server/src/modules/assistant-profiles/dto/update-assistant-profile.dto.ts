import { PartialType } from "@nestjs/swagger";
import { CreateAssistantProfileDto } from "./create-assistant-profile.dto";

export class UpdateAssistantProfileDto extends PartialType(CreateAssistantProfileDto) {}
