import {AnyAction} from "redux";
import {NgFluxifyModule} from "../ng-fluxify.module";

type QueueItem = { action: AnyAction, promise?: Promise<void>, resolve?: () => void, reject?: (reason?: any) => void };

export class DispatchQueue {
  private queue: QueueItem[] = [];
  private dispatchTimeout: number;

  enQueue(action: AnyAction): Promise<void> {
    let similar: QueueItem;

    if (action.type.endsWith('_READ_RESPONSE')) {
      similar = this.queue
        .find(item => item.action.transactionId === action.transactionId && item.action.type === action.type);
    } else if (similar = this.queue.find(item => JSON.stringify(item.action) === JSON.stringify(action))) {
      return similar.promise;
    }

    if (similar) {
      if (!Array.isArray(similar.action.data)) {
        similar.action.data = [similar.action.data];
      }

      const newDataArray = Array.isArray(action.data) ? action.data : [action.data];
      newDataArray
        .filter(newData => similar.action.data.every(data => JSON.stringify(data) !== JSON.stringify(newData)))
        .forEach(newData => similar.action.data.push(newData));

      return similar.promise;
    } else {
      const newItem: QueueItem = {action};
      newItem.promise = new Promise<void>((resolve, reject) => {
        newItem.resolve = resolve;
        newItem.reject = reject;

        this.startDispatch();
      });

      this.queue.push(newItem);
      return newItem.promise;
    }
  }

  private startDispatch() {
    if (this.dispatchTimeout) {
      return;
    }

    this.dispatchTimeout = setTimeout(() => {
      try {
        if (this.queue.length) {
          NgFluxifyModule.ngReduxService.ngRedux.dispatch(this.queue[0].action);
          this.queue[0].resolve();
          this.queue.splice(0, 1);
        }
      } catch (e) {
        if (e.message !== 'Reducers may not dispatch actions.') {
          this.queue[0].reject(e.message);
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
