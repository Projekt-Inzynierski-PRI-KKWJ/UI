import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCriteriaComponent } from './project-criteria.component';

describe('ProjectCriteriaComponent', () => {
  let component: ProjectCriteriaComponent;
  let fixture: ComponentFixture<ProjectCriteriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectCriteriaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
