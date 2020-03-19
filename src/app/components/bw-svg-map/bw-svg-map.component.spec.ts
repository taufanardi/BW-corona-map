import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BwSvgMapComponent } from './bw-svg-map.component';

describe('BwSvgMapComponent', () => {
  let component: BwSvgMapComponent;
  let fixture: ComponentFixture<BwSvgMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BwSvgMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BwSvgMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
