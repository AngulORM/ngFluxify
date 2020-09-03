import {Type} from '@angular/core';
import {AbstractEntity} from '../entities';

export interface AssociationDescriptor {
  entity: Type<AbstractEntity> | (() => Type<AbstractEntity>) | string;
  foreignKey: string;
  primaryKey?: string;
}
