import {AbstractReducer} from '../abstract.reducer';
import {AbstractEntity} from '../../domain/entities';
import {EntityDescriptor} from '../../domain/descriptors';
import {AnyAction} from 'redux';

export class DumbReducer<T extends AbstractEntity> extends AbstractReducer<T> {
  constructor(private entityDescriptor: EntityDescriptor) {
    super(entityDescriptor.name);
  }

  private static parseType(model: any, value: any): any {
    switch (typeof model) {
      case 'number':
        if (value === null) {
          return null;
        }
        return Number(value);
      case 'object':
        if (model instanceof Date) {
          return new Date(value);
        }
        return value;
      case 'boolean':
        return Boolean(Number(value) === 1);
      default:
        return value;
    }
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
    throw new Error('Not implemented');
  }

  private instanciateEntity(jsonObject: any): T {
    const entity: T = new this.entityDescriptor.class();

    Object.getOwnPropertyNames(entity).forEach((element: string) => {
      if (element in jsonObject) {
        entity[element] = DumbReducer.parseType(entity[element], jsonObject[element]);
      }
    });

    return entity;
  }
}
