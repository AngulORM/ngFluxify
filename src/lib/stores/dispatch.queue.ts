import {AnyAction} from "redux";
import {NgFluxifyModule} from "../ng-fluxify.module";

export class DispatchQueue {
  private queue: AnyAction[] = [];
  private dispatchTimeout: number;

  enQueue(action: AnyAction) {
    if (this.queue.some(item => JSON.stringify(item) === JSON.stringify(action))) {
      return;
    }

    let similar: AnyAction = null;

    if (action.type.endsWith('_READ_RESPONSE')) {
      similar = this.queue.find(item => item.transactionId === action.transactionId && item.type === action.type);
    }

    if (similar) {
      if (Array.isArray(similar.data)) {
        similar.data.push(action.data);
      } else {
        similar.data = [similar.data, action.data];
      }
    } else {
      this.queue.push(action);
    }

    this.startDispatch();
  }

  private startDispatch() {
    if (this.dispatchTimeout) {
      return;
    }

    this.dispatchTimeout = setTimeout(() => {
      try {
        if (this.queue.length) {
          NgFluxifyModule.ngReduxService.ngRedux.dispatch(this.queue[0]);
          this.queue.splice(0, 1);
        }
      } catch (e) {
        if (e.message !== 'Reducers may not dispatch actions.') {
          this.queue.splice(0, 1);
        }
      } finally {
        delete this.dispatchTimeout;

        if (this.queue.length) {
          this.startDispatch();
        }
      }
    }, 50);
  }
}
