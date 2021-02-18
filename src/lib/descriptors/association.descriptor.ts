import {Type} from '@angular/core';

export interface AssociationDescriptor {
  entity: Type<any> | (() => Type<any>) | string;
  foreignKey: string;
  primaryKey?: string;
}
