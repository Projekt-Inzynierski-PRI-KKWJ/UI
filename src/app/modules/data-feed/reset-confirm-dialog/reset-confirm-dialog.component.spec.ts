import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetConfirmDialogComponent } from './reset-confirm-dialog.component';

describe('ResetConfirmDialogComponent', () => {
  let component: ResetConfirmDialogComponent;
  let fixture: ComponentFixture<ResetConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResetConfirmDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
