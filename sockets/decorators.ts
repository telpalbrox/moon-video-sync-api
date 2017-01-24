import { socketMetadataStorage } from './SocketMetadata';

export function SocketController() {
    return function (object: Function) {
        socketMetadataStorage.controllers.push(object);
    }
}

export function ServerEvent(event: string) {
    return function (object: Object, methodName: string) {
        socketMetadataStorage.serverEvents.push({
            target: object.constructor,
            method: methodName,
            event
        });
    };
}

export function SocketEvent(event: string) {
    return function (object: Object, methodName: string) {
        socketMetadataStorage.socketEvents.push({
            target: object.constructor,
            method: methodName,
            event
        });
    };
}
