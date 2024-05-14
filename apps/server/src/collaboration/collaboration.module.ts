import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AuthenticationExtension } from './extensions/authentication.extension';
import { PersistenceExtension } from './extensions/persistence.extension';
import { CollaborationGateway } from './collaboration.gateway';
import { HttpAdapterHost } from '@nestjs/core';
import { CollabWsAdapter } from './adapter/collab-ws.adapter';
import { IncomingMessage } from 'http';
import { WebSocket } from 'ws';
import { HistoryExtension } from './extensions/history.extension';
import { TokenModule } from '../core/auth/token.module';

@Module({
  providers: [
    CollaborationGateway,
    AuthenticationExtension,
    PersistenceExtension,
    HistoryExtension,
  ],
  imports: [TokenModule],
})
export class CollaborationModule implements OnModuleInit, OnModuleDestroy {
  private collabWsAdapter: CollabWsAdapter;
  private path = '/collab';

  constructor(
    private readonly collaborationGateway: CollaborationGateway,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  onModuleInit() {
    this.collabWsAdapter = new CollabWsAdapter();
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

    const wss = this.collabWsAdapter.handleUpgrade(this.path, httpServer);

    wss.on('connection', (client: WebSocket, request: IncomingMessage) => {
      this.collaborationGateway.handleConnection(client, request);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.collaborationGateway) {
      await this.collaborationGateway.destroy();
    }
    if (this.collabWsAdapter) {
      this.collabWsAdapter.destroy();
    }
  }
}
