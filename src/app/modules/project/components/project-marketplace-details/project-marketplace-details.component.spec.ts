import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectMarketplaceDetailsComponent } from './project-marketplace-details.component';

describe('ProjectMarketplaceDetailsComponent', () => {
  let component: ProjectMarketplaceDetailsComponent;
  let fixture: ComponentFixture<ProjectMarketplaceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectMarketplaceDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectMarketplaceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
