import { TestBed } from '@angular/core/testing';

import { RegionDataService } from './region-data.service';

describe('RegionDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RegionDataService = TestBed.get(RegionDataService);
    expect(service).toBeTruthy();
  });
});
