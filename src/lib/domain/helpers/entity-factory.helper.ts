import { AbstractEntity } from '../entities/abstract.entity';
import { RestEntityManager } from '../api/rest-entity-manager';
import * as moment from 'moment-timezone';
import { RestService } from '../../services/rest-service';

export class EntityFactoryHelper {
  static create<T extends AbstractEntity>(modelType, jsonObject: any, manager: RestEntityManager<T>, service: RestService<T>): T {
    const model = new modelType();
    model.manager = manager;
    model.service = service;

    Object.getOwnPropertyNames(model).forEach(function (element: string) {
      if (element in jsonObject) {
        model[element] = EntityFactoryHelper.parseType(model[element], jsonObject[element]);
      }
    });
    return model;
  }

  static patch<T extends AbstractEntity>(model: T, jsonObject: any): T {
    Object.getOwnPropertyNames(model).forEach(function (element: string) {
      if (jsonObject[element]) {
        model[element] = jsonObject[element];
      }
    });
    return model;
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
          if (value !== undefined && typeof value === 'string') {
            const dateString: string = value;
            const dateArray = dateString.split('+');

            const date = new Date(dateArray[0].replace('Z', '') + moment(dateString).format('Z'));
            let infosNavigateur = navigator.userAgent
            .match(
                /(MSIE|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari|(?!AppleWebKit.+)Chrome|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/ig
            );
            if (infosNavigateur) {
              infosNavigateur = infosNavigateur[0].split('/');
            }
            if (infosNavigateur && Array.isArray(infosNavigateur)) {
              switch (infosNavigateur[0]) {
                case 'Firefox':
                  date.setHours(date.getHours() + (<number>Number(moment(dateString).format('ZZ')) / 100));
                  break;
                default:
                  break;
              }
            }
            return date;
          }
          return new Date(value);
        }
        return value;
      case 'boolean':
        return Boolean(Number(value) === 1);
      default:
        return value;
    }
  }
}
