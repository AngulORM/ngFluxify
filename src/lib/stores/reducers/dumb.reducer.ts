import {AbstractReducer} from '../abstract.reducer';
import {AbstractEntity} from '../../domain/entities';
import {EntityDescriptor, PropertyDescriptor} from '../../domain/descriptors';
import {AnyAction} from 'redux';

export class DumbReducer<T extends AbstractEntity> extends AbstractReducer<T> {
  constructor(private entityDescriptor: EntityDescriptor) {
    super(entityDescriptor.name);
  }

  protected create(action: AnyAction): T | T[] {
    if (Array.isArray(action.data)) {
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected read(action: AnyAction): T | T[] {
    if (Array.isArray(action.data)) {
      this.setCompleted = true;
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected update(action: AnyAction): T | T[] {
    if (Array.isArray(action.data)) {
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected delete(action: AnyAction): number | number[] {
    return action.data;
  }

  private instanciateEntity(jsonObject: any): T {
    const entity: T = new this.entityDescriptor.class();
    const properties: Map<string, PropertyDescriptor> = this.entityDescriptor.class.properties;

    properties.forEach((value, key) => {
      if (key in jsonObject) {
        try {
          value.type.prototype.valueOf();
          entity[key] = value.type(jsonObject[key]);
        } catch {
          entity[key] = new value.type(jsonObject[key]);
        }
      }
    });

    return entity;
  }
}
