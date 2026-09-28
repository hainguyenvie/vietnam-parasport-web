import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from "@nestjs/common";
import { CapcutTemplatesService } from "./capcut-templates.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("capcut-templates")
export class CapcutTemplatesController {
  constructor(private readonly capcutTemplatesService: CapcutTemplatesService) {}

  @Get()
  findAll() {
    return this.capcutTemplatesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.capcutTemplatesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "EDITOR")
  create(
    @Body()
    createDto: {
      title: string;
      description?: string;
      capcutLink: string;
      thumbnailUrl?: string;
    }
  ) {
    return this.capcutTemplatesService.create(createDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "EDITOR")
  update(
    @Param("id") id: string,
    @Body()
    updateDto: {
      title?: string;
      description?: string;
      capcutLink?: string;
      thumbnailUrl?: string;
    }
  ) {
    return this.capcutTemplatesService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "EDITOR")
  remove(@Param("id") id: string) {
    return this.capcutTemplatesService.remove(id);
  }
}
