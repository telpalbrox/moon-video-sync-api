import { Container } from 'typedi';
import { socketMetadataStorage, findServerEventsWithTarget, SocketServerEventMetadata, findSocketEventsWithTarget } from './SocketMetadata';

export class SocketExecutor {
    constructor(private io: SocketIO.Server) { }

    registerServerEvents() {
        socketMetadataStorage.controllers.forEach((controller: Function) => {
            findServerEventsWithTarget(controller).forEach((socketServerEnventMetadata: SocketServerEventMetadata) => {
                const instance = Container.get(controller as any);
                this.io.on(socketServerEnventMetadata.event, (socket: SocketIO.Socket) => {
                    instance[socketServerEnventMetadata.method](socket);
                });
            });
        });
        return this;
    }

    registerSocketEvents() {
        socketMetadataStorage.controllers.forEach((controller: Function) => {
            this.io.on('connection', (socket) => {
                findSocketEventsWithTarget(controller).forEach((socketEventMetadata: SocketServerEventMetadata) => {
                    const instance = Container.get(controller as any);
                    socket.on(socketEventMetadata.event, (...args) => {
                        instance[socketEventMetadata.method](socket, ...args);
                    });
                });
            });
        });
        return this;
    }
}
