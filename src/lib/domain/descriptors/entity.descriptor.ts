import {ForwardRefFn, Type} from '@angular/core';
import {AbstractEntity} from '../entities';
import {IEntityService} from '../../services/IEntity.service';
import {AbstractReducer} from "../../stores";

export abstract class EntityDescriptor<T extends AbstractEntity> {
  abstract readonly reducerType: Type<AbstractReducer<T>> | ((forwardRefFn: ForwardRefFn) => Type<AbstractReducer<T>>);
  abstract readonly serviceType: Type<IEntityService<T>>;
  abstract readonly serviceDeps: any[];
  class?: Type<T> | any;
  name: string;

  canRead = true;
  canReadAll = true;
  canCreate = true;
  canUpdate = true;
  canDelete = true;

  expirationDetectionStrategy: (id?: any) => boolean;

  constructor(attributes: EntityDescriptorAttributes) {
    this.name = attributes.name;

    this.canRead = Reflect.has(attributes, 'canRead') ? attributes.canRead : true;
    this.canReadAll = Reflect.has(attributes, 'canReadAll') ? attributes.canReadAll : true;
    this.canCreate = Reflect.has(attributes, 'canCreate') ? attributes.canCreate : true;
    this.canUpdate = Reflect.has(attributes, 'canUpdate') ? attributes.canUpdate : true;
    this.canDelete = Reflect.has(attributes, 'canDelete') ? attributes.canDelete : true;

    this.expirationDetectionStrategy = Reflect.has(attributes, 'expirationDetectionStrategy') ? attributes.expirationDetectionStrategy : StrategyNeverExpire;
  }
}

export interface EntityDescriptorAttributes {
  name: string;
  canRead?: boolean;
  canReadAll?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  expirationDetectionStrategy?: (id: any) => boolean;
}

export function StrategyNeverExpire(): boolean {
  return false;
}

export function StrategyAlwaysExpire(): boolean {
  return true;
}
