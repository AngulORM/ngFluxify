export interface PropertyDescriptor {
  readonly type;
  readonly label?: string;
  readonly primary?: boolean;
  readonly enumerable?: boolean;
  parsingStrategy?: ParsingStrategy;
}

export enum ParsingStrategy {
  DEFAULT,
  IGNORE_DATASOURCE,
  IGNORE_GET_FROM_DATASOURCE,
  IGNORE_SET_TO_DATASOURCE
}
