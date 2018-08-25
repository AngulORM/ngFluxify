export class RestEntity {
    class: any;
    name: string;
    route: string;

    constructor(_name: string, _route: string) {
        this.name = _name; this.route = _route;
    }
}
