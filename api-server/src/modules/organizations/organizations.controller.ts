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
import { OrganizationsService } from "./organizations.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("organizations")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class OrganizationsController {
  constructor(private readonly OrganizationsService: OrganizationsService) {}

  @Get()
  findAll(@Query("sport") sport?: string, @Query("location") location?: string) {
    return this.OrganizationsService.findAll({ sport, location });
  }

  @Get("map/bounded")
  findBounded(
    @Query("minLat") minLat: string,
    @Query("maxLat") maxLat: string,
    @Query("minLng") minLng: string,
    @Query("maxLng") maxLng: string
  ) {
    return this.OrganizationsService.findBounded(
      parseFloat(minLat),
      parseFloat(maxLat),
      parseFloat(minLng),
      parseFloat(maxLng)
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    data: {
      name: string;
      location: string;
      sport: string;
      schedule: string;
      suitableFor: string;
      contactInfo: string;
      imageUrl?: string;
      description: string;
    }
  ) {
    return this.OrganizationsService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post("admin")
  createAdmin(
    @Body()
    data: {
      name: string;
      location: string;
      sport: string;
      schedule: string;
      suitableFor: string;
      contactInfo: string;
      imageUrl?: string;
      description: string;
    }
  ) {
    return this.OrganizationsService.createAdmin(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get("pending")
  findPending() {
    return this.OrganizationsService.findPending();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get("admin/all")
  findAllAdmin() {
    return this.OrganizationsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id/approve")
  approve(@Param("id") id: string) {
    return this.OrganizationsService.approve(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body()
    data: {
      name?: string;
      location?: string;
      sport?: string;
      schedule?: string;
      suitableFor?: string;
      contactInfo?: string;
      imageUrl?: string;
      description?: string;
      isApproved?: boolean;
    }
  ) {
    return this.OrganizationsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.OrganizationsService.delete(id);
  }
}
