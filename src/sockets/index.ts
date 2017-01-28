import { SocketExecutor } from './SocketExecutor';

export function useIoServer(io: SocketIO.Server) {
    new SocketExecutor(io).registerServerEvents().registerSocketEvents();
}
