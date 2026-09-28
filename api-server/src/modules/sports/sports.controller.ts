import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { SportsService } from "./sports.service";
import { CreateSportDto, UpdateSportDto } from "./dto/sport.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

@Controller("sports")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get()
  findAll() {
    return this.sportsService.findAll();
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.sportsService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sportsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  @UseInterceptors(
    FileInterceptor("icon", {
      storage: diskStorage({
        destination: "./uploads/sports",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpeg|png|jpg)$/)) {
          return cb(new Error("Only image files are allowed!"), false);
        }
        cb(null, true);
      },
    })
  )
  create(@UploadedFile() iconFile: Express.Multer.File, @Body() data: CreateSportDto) {
    const iconPath = iconFile ? `uploads/sports/${iconFile.filename}` : "";
    return this.sportsService.create({ ...data, icon: iconPath } as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id")
  @UseInterceptors(
    FileInterceptor("icon", {
      storage: diskStorage({
        destination: "./uploads/sports",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpeg|png|jpg)$/)) {
          return cb(new Error("Only image files are allowed!"), false);
        }
        cb(null, true);
      },
    })
  )
  update(
    @Param("id") id: string,
    @UploadedFile() iconFile: Express.Multer.File,
    @Body() data: UpdateSportDto
  ) {
    const iconPath = iconFile ? `uploads/sports/${iconFile.filename}` : undefined;
    const payload = iconPath ? { ...data, icon: iconPath } : data;
    return this.sportsService.update(id, payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.sportsService.delete(id);
  }
}
