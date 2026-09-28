import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController, StoresController } from "./products.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [ProductsService],
  controllers: [ProductsController, StoresController],
})
export class ProductsModule {}
