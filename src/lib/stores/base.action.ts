export class BaseActionsManager {
  readonly requestKey: string = 'REQUEST';
  readonly responseKey: string = 'RESPONSE';
  readonly errorKey: string = 'ERROR';

  private actions: string[] = [];
  private readonly separator: string = '_';

  constructor(readonly reducerName: string) {
  }

  /**
   * Add an action string in the array
   * @param actionParams string[]
   */
  addAction(actionParams: string[]): void {
    this.actions.push(this.buildAction(actionParams));
  }

  /**
   * Register request/response/error actions for request
   * @param actionParams string[]
   */
  addActionSet(actionParams: string[]): void {
    this.addAction(Array.from(actionParams).concat([this.requestKey]));
    this.addAction(Array.from(actionParams).concat([this.responseKey]));
    this.addAction(Array.from(actionParams).concat([this.errorKey]));
  }

  /**
   * Get existing action string
   * @param actionParams string[]
   * @returns {undefined|string}
   */
  getAction(actionParams: string[]): string {
    const actionString = this.buildAction(actionParams);
    return this.actions.find(function (element) {
      return element === actionString;
    });
  }

  /**
   * Get request action
   * @param actionParams
   * @returns {undefined|string}
   */
  getRequestAction(actionParams: string[]): string {
    return this.getAction(Array.from(actionParams).concat([this.requestKey]));
  }

  /**
   * Get response action
   * @param actionParams
   * @returns {undefined|string}
   */
  getResponseAction(actionParams: string[]): string {
    return this.getAction(Array.from(actionParams).concat([this.responseKey]));
  }

  /**
   * Get error action
   * @param actionParams
   * @returns {undefined|string}
   */
  getErrorAction(actionParams: string[]): string {
    return this.getAction(Array.from(actionParams).concat([this.errorKey]));
  }

  /**
   * Return the regex pattern for actions registered
   * @returns {string}
   */
  getActionScheme(): string {
    return `^${this.reducerName.toUpperCase()}(${this.separator}[A-Z]+)+$`;
  }

  /**
   * Build the action string from the parameters and the reducer name
   * @param actionParams string[]
   * @returns {string}
   */
  private buildAction(actionParams: string[]): string {
    return [this.reducerName].concat(actionParams).join(this.separator).toUpperCase();
  }
}
