import {AnyAction} from 'redux';

export interface RequestAction extends AnyAction {
  transactionId: number;
  arguments?: any[];
}
