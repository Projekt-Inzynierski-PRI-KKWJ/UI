import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

import { ProjectCriteriaService } from '../../services/project-criterion.service';
import { CriteriaProjectDTO } from '../../models/project-criterion.model';

@Component({
  selector: 'project-add-criteria',
  templateUrl: './project-add-criteria.component.html',
  styleUrls: ['./project-add-criteria.component.scss']
})
export class ProjectAddCriteriaComponent implements OnInit, OnDestroy {
  projectCriteria!: FormGroup;
  projectId!: number;
  userId!: number;
  comingFromDetailsPage = false;
  private unsubscribe$ = new Subject<void>();

  semesters = ['FIRST', 'SECOND'];

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private criteriaService: ProjectCriteriaService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {
    this.projectCriteria = this.fb.group({
      criteriaList: this.fb.array([this.createCriteriaGroup()])
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.projectId = +params['id'];
    });

    this.activatedRoute.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.comingFromDetailsPage = params['comingFromDetailsPage'] === 'true';
    });

    // Replace with real logged-in user ID if available
    this.userId = 1;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get criteriaList(): FormArray {
    return this.projectCriteria.get('criteriaList') as FormArray;
  }

  get criteriaGroups(): FormGroup[] {
    return this.criteriaList.controls as FormGroup[];
  }

  createCriteriaGroup(): FormGroup {
    return this.fb.group({
      criterium: ['', Validators.required],
      levelOfRealization: [0, [Validators.required, Validators.min(0)]],
      semester: ['', Validators.required],
      type: ['Required', Validators.required],
      enableForModification: [true]
    });
  }

  addCriteria(): void {
    this.criteriaList.push(this.createCriteriaGroup());
  }

  removeCriteria(index: number): void {
    if (this.criteriaList.length > 1) {
      this.criteriaList.removeAt(index);
    }
  }

  getErrorMessage(controlName: string, group: FormGroup): string {
    const control = group.get(controlName);
    if (control?.hasError('required')) {
      return 'You must enter a value';
    }
    if (control?.hasError('min')) {
      return 'Must be at least 0';
    }
    return '';
  }

  private mapLevelOfRealization(value: number): 'IN_PROGRESS' | 'PARTIALLY_COMPLETED' | 'COMPLETED' {
    switch (value) {
      case 0: return 'IN_PROGRESS';
      case 1: return 'PARTIALLY_COMPLETED';
      case 2: return 'COMPLETED';
      default: return 'IN_PROGRESS';
    }
  }

  onSubmit(): void {
    if (this.projectCriteria.valid) {
      const payload: CriteriaProjectDTO[] = this.criteriaGroups.map(group => ({
        criterium: group.get('criterium')?.value,
        levelOfRealization: this.mapLevelOfRealization(group.get('levelOfRealization')?.value),
        semester: group.get('semester')?.value,
        projectId: this.projectId,
        userId: this.userId,
        enableForModification: group.get('enableForModification')?.value,
        type: group.get('type')?.value as 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS'
      }));

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      this.criteriaService.addCriteria(payload).subscribe({
        next: () => {
          this.snackBar.open('Criteria successfully submitted', 'Close', { duration: 3000 });
          this.navigateBack();
        },
        error: (err) => {
          console.error('Submission error:', err);
          this.snackBar.open('Error submitting criteria', 'Close', { duration: 3000 });
        }
      });
    }
  }

  navigateBack(): void {
    this.location.back();
  }
}
