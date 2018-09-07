import {RequestAction} from './request.action';

export interface ErrorAction extends RequestAction {
  error: Error;
}
