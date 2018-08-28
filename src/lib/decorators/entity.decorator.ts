import {entitiesList} from '../domain/entities.list';
import {EntityDescriptor} from "../domain/descriptors";

export function Entity(entityDescriptor: EntityDescriptor): ClassDecorator {
    return function (constructor: any) {
        entitiesList.push(entityDescriptor);
    };
}
