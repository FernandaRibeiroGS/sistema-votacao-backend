import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ResultsService } from './results.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/results',
})
export class ResultsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ResultsGateway.name);

  constructor(private readonly resultsService: ResultsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // Cliente envia { contestId } para entrar na sala do concurso
  @SubscribeMessage('join-contest')
  async handleJoinContest(client: Socket, payload: { contestId?: number }) {
    const room = `contest-${payload?.contestId ?? 'active'}`;
    client.join(room);

    const results = await this.resultsService.getLiveResults(payload?.contestId);
    client.emit('results-update', results);
  }

  // Chamado pelo VoteProcessor após cada voto gravado
  async broadcastResults(contestId: number) {
    const results = await this.resultsService.getLiveResults(contestId);
    this.server.to(`contest-${contestId}`).emit('results-update', results);
    this.server.to('contest-active').emit('results-update', results);
  }
}
