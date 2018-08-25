export class BaseActionsManager {
    readonly reducerName: string;
    readonly HTTPRequestKey: string = 'REQUEST';
    readonly HTTPResponseKey: string = 'RESPONSE';
    readonly HTTPErrorKey: string = 'ERROR';
    private actions: string[];
    private readonly separator: string = '_';

    constructor(reducerName: string) {
      this.reducerName = reducerName;
      this.actions = [];
    }

    /**
     * Add an action string in the array
     * @param actionParams string[]
     */
    addAction(actionParams: string[]): void {
      this.actions.push(this.buildAction(actionParams));
    }

    /**
     * Register actions for HTTP request
     * @param actionParams string[]
     */
    addHTTPAction(actionParams: string[]): void {
      this.addAction(Array.from(actionParams).concat([this.HTTPRequestKey]));
      this.addAction(Array.from(actionParams).concat([this.HTTPResponseKey]));
      this.addAction(Array.from(actionParams).concat([this.HTTPErrorKey]));
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

    getActionScheme(): string {
      return `^${this.reducerName.toUpperCase()}(${this.separator}[A-Z]+)+$`;
    }

    /**
     * Get existing HTTP request action string
     * @param actionParams string[]
     * @returns {string}
     */
    getHTTPRequestAction(actionParams: string[]) {
      return this.getAction(Array.from(actionParams).concat([this.HTTPRequestKey]));
    }

    /**
     * Get existing HTTP response action string
     * @param actionParams string[]
     * @returns {string}
     */
    getHTTPResponseAction(actionParams: string[]) {
      return this.getAction(Array.from(actionParams).concat([this.HTTPResponseKey]));
    }

    /**
     * Get existing HTTP error action string
     * @param actionParams string[]
     * @returns {string}
     */
    getHTTPErrorAction(actionParams: string[]) {
      return this.getAction(Array.from(actionParams).concat([this.HTTPErrorKey]));
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
