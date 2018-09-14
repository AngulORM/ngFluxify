export abstract class EntityDescriptor {
  abstract readonly reducerType: any;
  abstract readonly serviceType: any;
  class?: any;
  name: string;

  constructor(_name: string) {
    this.name = _name;
  }
}
