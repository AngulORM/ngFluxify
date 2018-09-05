import {AbstractReducer} from '../abstract.reducer';
import {AbstractRestEntity} from '../../domain/entities';
import {EntityDescriptor} from '../../domain/descriptors';
import {AnyAction} from 'redux';

export class RestReducer<T extends AbstractRestEntity> extends AbstractReducer<T> {
  constructor(entityDescriptor: EntityDescriptor) {
    super(entityDescriptor.name);
  }

  protected create(action: AnyAction): T | T[] {
    throw new Error('Not implemented');
  }

  protected read(action: AnyAction): T | T[] {
    throw new Error('Not implemented');
  }

  protected update(action: AnyAction): T | T[] {
    throw new Error('Not implemented');
  }

  protected delete(action: AnyAction): number | number[] {
    throw new Error('Not implemented');
  }
}
