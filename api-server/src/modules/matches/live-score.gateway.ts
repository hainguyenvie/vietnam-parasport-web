import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },
  namespace: "/live-scores",
})
export class LiveScoreGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveScoreGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (token) {
        const payload = this.jwtService.verify(token as string);
        (client as any).user = payload;
        this.logger.log(`Authenticated client: ${client.id} (user: ${payload.email})`);
      } else {
        this.logger.log(`Anonymous client connected: ${client.id} (public access)`);
        (client as any).user = null;
      }
    } catch {
      this.logger.warn(`Invalid auth token from client: ${client.id}, allowing as anonymous`);
      (client as any).user = null;
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Live Scores: ${client.id}`);
  }

  emitScoreUpdate(matchId: string, payload: any) {
    this.server.to(`match:${matchId}`).emit("SCORE_UPDATED", {
      matchId,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
