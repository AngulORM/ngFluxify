// @dynamic
export class TransactionState {
  static readonly started: string = 'STARTED';
  static readonly finished: string = 'FINISHED';
  static readonly error: string = 'ERROR';

  state: string;
  error?: Error;
  entities?: number[];
}
