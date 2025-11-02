import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitializeCoordinatorComponent } from './initialize-coordinator.component';

describe('InitializeCoordinatorComponent', () => {
  let component: InitializeCoordinatorComponent;
  let fixture: ComponentFixture<InitializeCoordinatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InitializeCoordinatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InitializeCoordinatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
