import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from "@nestjs/common";
import { DocumentTopicsService } from "./document-topics.service";
import { CreateDocumentTopicDto } from "./dto/create-document-topic.dto";
import { UpdateDocumentTopicDto } from "./dto/update-document-topic.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("document-topics")
export class DocumentTopicsController {
  constructor(private readonly documentTopicsService: DocumentTopicsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Post()
  create(@Body() createDocumentTopicDto: CreateDocumentTopicDto) {
    return this.documentTopicsService.create(createDocumentTopicDto);
  }

  @Get()
  findAll() {
    return this.documentTopicsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documentTopicsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id")
  update(@Param("id") id: string, @Body() updateDocumentTopicDto: UpdateDocumentTopicDto) {
    return this.documentTopicsService.update(id, updateDocumentTopicDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.documentTopicsService.remove(id);
  }
}
