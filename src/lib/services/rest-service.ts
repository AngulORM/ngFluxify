import {AbstractRestEntity} from '../domain/entities';
import {RestEntityDescriptor} from '../domain/descriptors';
import {IEntityService} from './IEntity.service';

export class RestService<T extends AbstractRestEntity> implements IEntityService<RestEntityDescriptor> {

}
