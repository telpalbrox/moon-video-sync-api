export interface SocketControllerMetadata {
    target?: Function
}

export interface SocketServerEventMetadata {
    target: Function;
    method: string;
    event: string;
}

export const socketMetadataStorage = {
    controllers: [],
    serverEvents: [],
    socketEvents: []
};

export function findServerEventsWithTarget(target: Function) {
    return socketMetadataStorage.serverEvents.filter((socketServerEnventMetadata: SocketServerEventMetadata) => {
        return socketServerEnventMetadata.target === target;
    });
}

export function findSocketEventsWithTarget(target: Function) {
    return socketMetadataStorage.socketEvents.filter((socketServerEnventMetadata: SocketServerEventMetadata) => {
        return socketServerEnventMetadata.target === target;
    });
}
