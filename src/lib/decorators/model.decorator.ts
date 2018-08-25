import { RestEntity } from '../domain/api/rest-entity';
import { ENTITIES } from '../domain/entities/Entities';
import { entities } from '../domain/rest-entities';


export function Entity(restEntity: RestEntity): ClassDecorator {
    return function (constructor: any) {
      const ngOnInit = constructor.prototype.ngOnInit;
      console.log('ok');
      entities.push(restEntity);
    };
}
