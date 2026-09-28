import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { AssistantProfilesService } from "./assistant-profiles.service";
import { CreateAssistantProfileDto } from "./dto/create-assistant-profile.dto";
import { UpdateAssistantProfileDto } from "./dto/update-assistant-profile.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("assistant-profiles")
@Controller("assistant-profiles")
export class AssistantProfilesController {
  constructor(private readonly assistantProfilesService: AssistantProfilesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a new assistant profile" })
  @ApiResponse({ status: 201, description: "Created successfully." })
  create(@Body() createAssistantProfileDto: CreateAssistantProfileDto) {
    return this.assistantProfilesService.create(createAssistantProfileDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all assistant profiles" })
  findAll() {
    return this.assistantProfilesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an assistant profile by ID" })
  findOne(@Param("id") id: string) {
    return this.assistantProfilesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update an assistant profile" })
  update(@Param("id") id: string, @Body() updateAssistantProfileDto: UpdateAssistantProfileDto) {
    return this.assistantProfilesService.update(id, updateAssistantProfileDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete an assistant profile" })
  remove(@Param("id") id: string) {
    return this.assistantProfilesService.remove(id);
  }
}
