import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { SubTournamentsService } from "./sub-tournaments.service";
import { BracketEngineService } from "./bracket-engine.service";
import { CreateSubTournamentDto } from "./dto/create-sub-tournament.dto";
import { UpdateSubTournamentDto } from "./dto/update-sub-tournament.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("sub-tournaments")
@Controller("sub-tournaments")
export class SubTournamentsController {
  constructor(
    private readonly subTournamentsService: SubTournamentsService,
    private readonly bracketEngineService: BracketEngineService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a new sub-tournament" })
  @ApiResponse({ status: 201, description: "Created successfully." })
  create(@Body() createSubTournamentDto: CreateSubTournamentDto) {
    return this.subTournamentsService.create(createSubTournamentDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all sub-tournaments" })
  findAll() {
    return this.subTournamentsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a sub-tournament by ID" })
  findOne(@Param("id") id: string) {
    return this.subTournamentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update a sub-tournament" })
  update(@Param("id") id: string, @Body() updateSubTournamentDto: UpdateSubTournamentDto) {
    return this.subTournamentsService.update(id, updateSubTournamentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a sub-tournament" })
  remove(@Param("id") id: string) {
    return this.subTournamentsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post(":id/generate-bracket")
  @ApiOperation({ summary: "Generate bracket for a sub-tournament" })
  generateBracket(@Param("id") id: string, @Body("participantIds") participantIds: string[]) {
    return this.bracketEngineService.generateBracket(id, participantIds || []);
  }
}
