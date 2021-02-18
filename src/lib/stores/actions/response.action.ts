import {RequestAction} from './request.action';

export interface ResponseAction extends RequestAction {
  data: any | any[];
  isComplete?: boolean;
}
