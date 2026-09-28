import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from "@nestjs/common";
import { BookmarksService } from "./bookmarks.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("bookmarks")
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAllByUser(@Request() req: any) {
    return this.bookmarksService.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("check/:postId")
  checkBookmark(@Request() req: any, @Param("postId") postId: string) {
    return this.bookmarksService.check(req.user.id, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("toggle")
  toggleBookmark(@Request() req: any, @Body("postId") postId: string) {
    return this.bookmarksService.toggle(req.user.id, postId);
  }
}
