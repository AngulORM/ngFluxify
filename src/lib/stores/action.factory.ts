import { BaseActionsManager } from './base.action';


export class ActionsManagerFactory {
  private static actionsManagers: BaseActionsManager[] = [];

  public static getActionsManager(name: string): BaseActionsManager {
    if (!ActionsManagerFactory.actionsManagers[name]) {
      ActionsManagerFactory.actionsManagers[name] = new BaseActionsManager(name.toUpperCase());
    }

    return ActionsManagerFactory.actionsManagers[name];
  }
}
