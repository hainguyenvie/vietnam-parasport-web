import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { DisabilityTypesService } from "./disability-types.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateDisabilityTypeDto, UpdateDisabilityTypeDto } from "./dto/disability-type.dto";

@Controller("disability-types")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class DisabilityTypesController {
  constructor(private readonly disabilityTypesService: DisabilityTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() createDisabilityTypeDto: CreateDisabilityTypeDto) {
    return this.disabilityTypesService.create(createDisabilityTypeDto);
  }

  @Get()
  findAll() {
    return this.disabilityTypesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.disabilityTypesService.findOne(id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body() updateDisabilityTypeDto: UpdateDisabilityTypeDto) {
    return this.disabilityTypesService.update(id, updateDisabilityTypeDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string) {
    return this.disabilityTypesService.remove(id);
  }
}
