import { Reducer } from 'redux';
import { BaseActionsManager } from './base.action';

export abstract class AbstractReducer {
  private static expirations: any[] = [];

  public constructor(protected actionsManager: BaseActionsManager) {
    this.setActions();
  }

  /**
   * Return the expiration date for a given data
   * @param reducer string
   * @param dataIdentifier string
   * @returns Date|null
   */
  public static getExpiration(reducer: string, dataIdentifier: string): Date {
    const reducerExpirations = AbstractReducer.expirations[reducer.toUpperCase()];
    if (reducerExpirations) {
      return reducerExpirations[dataIdentifier.toUpperCase()];
    }

    return;
  }

  /**
   * Set all declared informations as expired
   */
  public static forceExpirations(): void {
    const newExpirations: any[] = [];
    for (const idReducer in AbstractReducer.expirations) {
      if (AbstractReducer.expirations.hasOwnProperty(idReducer)) {
        const newExpirationsReducer = [];
        for (const idData in AbstractReducer.expirations[idReducer]) {
          if (AbstractReducer.expirations[idReducer].hasOwnProperty(idData)) {
            newExpirationsReducer[idData] = new Date();
          }
        }
        newExpirations[idReducer] = newExpirationsReducer;
      }
    }

    AbstractReducer.expirations = newExpirations;
  }

  public abstract createReducer(): Reducer<any>;

  /**
   * Store expiration date for a given data identifier
   * @param dataIdentifier string
   * @param validityDuration number Data duration in milliseconds, default 5 minutes
   */
  protected setExpiration(dataIdentifier: string, validityDuration: number = 30000): void {
    let expirations: Date[] = AbstractReducer.expirations[this.actionsManager.reducerName.toUpperCase()];
    if (!expirations) {
      expirations = [];
    }
    expirations[dataIdentifier.toUpperCase()] = new Date(Date.now() + validityDuration);
    AbstractReducer.expirations[this.actionsManager.reducerName.toUpperCase()] = expirations;
  }

  protected abstract setActions(): void;

}
