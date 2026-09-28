import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findMyOrders(@Request() req: any, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.ordersService.findMyOrders(req.user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findById(@Request() req: any, @Param("id") id: string) {
    return this.ordersService.findById(id, req.user.id);
  }
}
