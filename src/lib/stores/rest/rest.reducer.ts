import {AbstractReducer} from '../abstract.reducer';
import {AbstractRestEntity} from '../../domain/entities';
import {EntityDescriptor} from '../../domain/descriptors';

export class RestReducer<T extends AbstractRestEntity> extends AbstractReducer<T> {
  constructor(entityDescriptor: EntityDescriptor) {
    super(entityDescriptor.name);
  }

  protected create(): T | T[] {
    throw new Error('Not implemented');
  }

  protected read(): T | T[] {
    throw new Error('Not implemented');
  }

  protected update(): T | T[] {
    throw new Error('Not implemented');
  }

  protected delete(): number | number[] {
    throw new Error('Not implemented');
  }
}
