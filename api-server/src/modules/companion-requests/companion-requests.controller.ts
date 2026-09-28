import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CompanionRequestsService } from "./companion-requests.service";
import { CreateCompanionRequestDto } from "./dto/companion-request.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("companion-requests")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class CompanionRequestsController {
  constructor(private readonly companionRequestsService: CompanionRequestsService) {}

  @Post()
  create(@Body() data: CreateCompanionRequestDto) {
    return this.companionRequestsService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string
  ) {
    return this.companionRequestsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id/read")
  markRead(@Param("id") id: string) {
    return this.companionRequestsService.markRead(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.companionRequestsService.delete(id);
  }
}
