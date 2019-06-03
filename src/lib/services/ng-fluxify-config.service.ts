import {InjectionToken} from '@angular/core';

export const NgFluxifyConfigService = new InjectionToken<NgFluxifyConfig>('NgFluxifyConfig', {
  factory: () => <NgFluxifyConfig>{}
});

export interface NgFluxifyConfig {
  enableStoreLogger?: boolean;
}
