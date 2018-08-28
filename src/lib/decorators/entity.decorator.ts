import {entities} from '../domain/rest-entities';
import {EntityDescriptor} from "../domain/api/entity.descriptor";

export function Entity(entityDescriptor: EntityDescriptor): ClassDecorator {
    return function (constructor: any) {
        entities.push(entityDescriptor);
    };
}
