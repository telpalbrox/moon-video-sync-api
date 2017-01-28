export interface SocketControllerMetadata {
    target?: Function
}

export interface SocketServerEnventMetadata {
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
    return socketMetadataStorage.serverEvents.filter((socketServerEnventMetadata: SocketServerEnventMetadata) => {
        return socketServerEnventMetadata.target === target;
    });
}

export function findSocketEventsWithTarget(target: Function) {
    return socketMetadataStorage.socketEvents.filter((socketServerEnventMetadata: SocketServerEnventMetadata) => {
        return socketServerEnventMetadata.target === target;
    });
}
