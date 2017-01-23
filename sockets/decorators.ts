import { socketMetadataStorage } from './SocketMetadata';

export function SocketController() {
    console.log("SocketController(): evaluated");
    return function (object: Function) {
        console.log("SocketController(): called");
        socketMetadataStorage.controllers.push(object);
    }
}

export function ServerOn(event: string) {
    return function (object: Object, methodName: string) {
        socketMetadataStorage.serverEvents.push({
            target: object.constructor,
            method: methodName,
            event
        });
    }
}
