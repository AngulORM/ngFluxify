import { TestBed, inject } from '@angular/core/testing';

import { AngularRestService } from './angular-rest.service';

describe('AngularRestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AngularRestService]
    });
  });

  it('should be created', inject([AngularRestService], (service: AngularRestService) => {
    expect(service).toBeTruthy();
  }));
});
