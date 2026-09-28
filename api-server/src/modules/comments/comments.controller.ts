import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CreateCommentDto,
  ReactCommentDto,
  ModerateCommentDto,
  UpdateCommentDto,
} from "./dto/comment.dto";

@Controller("comments")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Get("admin/all")
  findAllAdmin() {
    return this.commentsService.findAll();
  }

  @Get()
  findByQuery(
    @Query("postId") postId?: string,
    @Query("matchId") matchId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    if (postId) return this.commentsService.findByPost(postId, pageNum, limitNum);
    if (matchId) return this.commentsService.findByMatch(matchId, pageNum, limitNum);
    return [];
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() body: CreateCommentDto) {
    const data: any = {
      content: body.content,
      user: { connect: { id: req.user.id } },
    };
    if (body.postId) data.post = { connect: { id: body.postId } };
    if (body.matchId) data.match = { connect: { id: body.matchId } };
    if (body.parentId) data.parent = { connect: { id: body.parentId } };
    if (body.imageAttachments) data.imageAttachments = body.imageAttachments;
    return this.commentsService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id/react")
  react(@Request() req: any, @Param("id") id: string, @Body() body: ReactCommentDto) {
    return this.commentsService.react(id, req.user.id, body.type);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @Put(":id")
  updateStatus(@Param("id") id: string, @Body() body: ModerateCommentDto) {
    const isApproved = body.status === "APPROVED";
    return this.commentsService.updateStatus(id, isApproved);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  updateContent(@Request() req: any, @Param("id") id: string, @Body() body: UpdateCommentDto) {
    return this.commentsService.updateContent(id, req.user.id, req.user.role, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.commentsService.remove(id, req.user.id, req.user.role);
  }
}
