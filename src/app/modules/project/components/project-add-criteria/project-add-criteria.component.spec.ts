import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAddCriteriaComponent } from './project-add-criteria.component';

describe('ProjectAddCriteriaComponent', () => {
  let component: ProjectAddCriteriaComponent;
  let fixture: ComponentFixture<ProjectAddCriteriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectAddCriteriaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAddCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
