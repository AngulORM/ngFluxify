export abstract class EntityDescriptor {
  abstract readonly reducerType: any;
  class?: any;
  name: string;

  constructor(_name: string) {
    this.name = _name;
  }
}
