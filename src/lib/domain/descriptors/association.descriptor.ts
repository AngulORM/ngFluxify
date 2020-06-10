import {Type} from '@angular/core';
import {AbstractEntity} from '../entities';

export interface AssociationDescriptor {
  entity: Type<AbstractEntity>;
  foreignKey: string;
  primaryKey?: string;
}
