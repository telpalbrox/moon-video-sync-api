import { Container } from 'typedi';
import { socketMetadataStorage, findServerEventsWithTarget, SocketServerEnventMetadata } from './SocketMetadata';

export class SocketExecutor {
    constructor(private io: SocketIO.Server) { }

    registerServerEvents() {
        socketMetadataStorage.controllers.forEach((controller: Function) => {
            findServerEventsWithTarget(controller).forEach((socketServerEnventMetadata: SocketServerEnventMetadata) => {
                const instance = Container.get(controller as any);
                this.io.on(socketServerEnventMetadata.event, (socket: SocketIO.Socket) => {
                    instance[socketServerEnventMetadata.method](socket);
                });
            });
        });
    }
}
