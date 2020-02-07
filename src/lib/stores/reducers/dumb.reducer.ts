import {AbstractReducer} from '../abstract.reducer';
import {AbstractEntity} from '../../domain/entities';
import {EntityDescriptor, ParsingStrategy, PropertyDescriptor} from '../../domain/descriptors';
import {AnyAction} from 'redux';

export class DumbReducer<T extends AbstractEntity> extends AbstractReducer<T> {
  constructor(entityDescriptor: EntityDescriptor<T>) {
    super(entityDescriptor);
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

  protected delete(action: AnyAction): any | any[] {
    return action.data;
  }

  private instanciateEntity(jsonObject: any): T {
    if (!jsonObject) {
      return null;
    }

    const entity: T = new this.entityDescriptor.class();
    const properties: Map<string, PropertyDescriptor> = this.entityDescriptor.class.properties;

    properties.forEach((value, key) => {
      if (value.parsingStrategy === ParsingStrategy.IGNORE_DATASOURCE || value.parsingStrategy === ParsingStrategy.IGNORE_GET_FROM_DATASOURCE) {
        return;
      }

      const label = value.label || key;
      if (label in jsonObject) {
        Reflect.set(entity, key, jsonObject[label]);
      }
    });

    return entity;
  }
}
