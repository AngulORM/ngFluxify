import {InjectionToken} from '@angular/core';

export const NgFluxifyConfigService = new InjectionToken<NgFluxifyConfig>('NgFluxifyConfig', {
  factory: () => <NgFluxifyConfig>{}
});

export interface NgFluxifyConfig {
  enableStoreLogger?: boolean;

  /**
   * Enhance store writing performance by temporary disabling immutability
   */
  enableDynamicStateMutability?: boolean;
}
