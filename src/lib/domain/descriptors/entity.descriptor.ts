export abstract class EntityDescriptor {
  abstract readonly reducerType: any;
  abstract readonly serviceType: any;
  class?: any;
  name: string;

  canRead = true;
  canReadAll = true;
  canCreate = true;
  canUpdate = true;
  canDelete = true;

  constructor(attributes: EntityDescriptorAttributes) {
    this.name = attributes.name;

    this.canRead = Reflect.has(attributes, 'canRead') ? attributes.canRead : true;
    this.canReadAll = Reflect.has(attributes, 'canReadAll') ? attributes.canReadAll : true;
    this.canCreate = Reflect.has(attributes, 'canCreate') ? attributes.canCreate : true;
    this.canUpdate = Reflect.has(attributes, 'canUpdate') ? attributes.canUpdate : true;
    this.canDelete = Reflect.has(attributes, 'canDelete') ? attributes.canDelete : true;
  }
}

export interface EntityDescriptorAttributes {
  name: string;
  canRead?: boolean;
  canReadAll?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}
