import {EntityDescriptor} from "./entity.descriptor";

export class RestEntityDescriptor extends EntityDescriptor {
    route: string;

    constructor(_name: string, _route: string) {
        super(_name);
        this.route = _route;
    }
}
