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
    serverEvents: []
};

export function findServerEventsWithTarget(target: Function) {
    return socketMetadataStorage.serverEvents.filter((socketServerEnventMetadata: SocketServerEnventMetadata) => {
        return socketServerEnventMetadata.target === target;
    });
}
