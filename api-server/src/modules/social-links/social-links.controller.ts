import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SocialLinksService } from "./social-links.service";
import { CreateSocialLinkDto } from "./dto/create-social-link.dto";
import { UpdateSocialLinkDto } from "./dto/update-social-link.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("social-links")
export class SocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Post()
  create(@Body() createSocialLinkDto: CreateSocialLinkDto) {
    return this.socialLinksService.create(createSocialLinkDto);
  }

  @Get()
  findAll(@Query("activeOnly") activeOnly?: string) {
    const onlyActive = activeOnly === "true";
    return this.socialLinksService.findAll(onlyActive);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.socialLinksService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Put(":id")
  update(@Param("id") id: string, @Body() updateSocialLinkDto: UpdateSocialLinkDto) {
    return this.socialLinksService.update(id, updateSocialLinkDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.socialLinksService.remove(id);
  }
}
