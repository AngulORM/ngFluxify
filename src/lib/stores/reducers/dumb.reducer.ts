import {AbstractReducer} from '../abstract.reducer';
import {ParsingStrategy, PropertyDescriptor} from '../../descriptors';
import {ResponseAction} from "../actions";
import {EntityData, EntityType, getModel} from "../../decorators";

export class DumbReducer<T extends Object> extends AbstractReducer<T> {
  protected create(action: ResponseAction): EntityData<T> | EntityData<T>[] {
    if (Array.isArray(action.data)) {
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected read(action: ResponseAction): EntityData<T> | EntityData<T>[] {
    if (Array.isArray(action.data)) {
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected update(action: ResponseAction): EntityData<T> | EntityData<T>[] {
    if (Array.isArray(action.data)) {
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected delete(action: ResponseAction): any | any[] {
    return action.data;
  }

  private instanciateEntity(jsonObject: any): EntityData<T> {
    if (!jsonObject) {
      return null;
    }

    const entity: EntityType<T> = new this.entityDescriptor.class();

    this.parse(entity, jsonObject);
    return entity._entityData;
  }

  private parse(entity: T, jsonObject: any) {
    const properties: Map<string, PropertyDescriptor> = getModel(this.entityDescriptor.class).properties;

    properties.forEach((value, key) => {
      this.parseProperty(entity, jsonObject, value, key);
    });
  }

  private parseProperty(entity: T, jsonObject: any, value: PropertyDescriptor, key: string) {
    if (value.parsingStrategy === ParsingStrategy.IGNORE_DATASOURCE || value.parsingStrategy === ParsingStrategy.IGNORE_GET_FROM_DATASOURCE) {
      return;
    }

    const label = value.label || key;
    if (label in jsonObject) {
      entity[key] = jsonObject[label];
    }
  }
}
