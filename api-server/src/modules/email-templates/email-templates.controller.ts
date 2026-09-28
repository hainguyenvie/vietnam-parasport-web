import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { EmailTemplatesService } from "./email-templates.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UpdateEmailTemplateDto, PreviewEmailTemplateDto } from "./dto/email-template.dto";

@Controller("email-templates")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  async findAll() {
    return this.emailTemplatesService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.emailTemplatesService.findOne(id);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateEmailTemplateDto) {
    return this.emailTemplatesService.update(id, body);
  }

  @Post("preview")
  async preview(@Body() body: PreviewEmailTemplateDto) {
    return this.emailTemplatesService.preview(body.content, body.variables);
  }
}
