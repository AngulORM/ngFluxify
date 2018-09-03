import {AbstractReducer} from '../abstract.reducer';
import {AbstractRestEntity} from '../../domain/entities';
import {BaseActionsManager} from '../base.action';
import {EntityDescriptor} from '../../domain/descriptors';

export class RestReducer<T extends AbstractRestEntity> extends AbstractReducer<T> {
  constructor(entityDescriptor: EntityDescriptor) {
    super(new BaseActionsManager(entityDescriptor.name));
  }
}
