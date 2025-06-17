import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProjectCriteriaService } from '../../services/project-criterion.service';
import { CriteriaProjectDTO } from '../../models/project-criterion.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'project-criteria',
  templateUrl: './project-criteria.component.html',
  styleUrls: ['./project-criteria.component.scss']
})
export class ProjectCriteriaComponent implements OnInit, OnDestroy {
  @Input() semester?: 'FIRST' | 'SECOND';
  @Input() type: 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS' | 'ALL' = 'ALL';
  projectId!: number;
  criteriaList: CriteriaProjectDTO[] = [];
  private unsubscribe$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private criteriaService: ProjectCriteriaService,
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.projectId = +params['id'];
      this.loadCriteria();
    });
  }

  loadCriteria(): void {
    this.criteriaService.getCriteriaByProjectId(this.projectId).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (criteria: CriteriaProjectDTO[]) => {
        this.criteriaList = criteria.filter(c =>
          (!this.semester || c.semester === this.semester) &&
          (this.type === 'ALL' || c.type === this.type) &&
          (!this.semester || c.type !== 'MEASURABLE_IMPLEMENTATION_INDICATORS')
        );
      },
      error: (err) => {
        console.error('Error loading criteria:', err);
      }
    });
  }

  deleteCriterion(id?: number): void {
    if (!id) {
      console.warn('Tried to delete criterion with undefined ID.');
      return;
    }

    this.http.delete(`/pri/api/criteria-projects/${id}`).subscribe({
      next: () => {
        console.log(`Criterion ${id} deleted.`);
        this.loadCriteria();
      },
      error: err => {
        console.error(`Error deleting criterion ${id}:`, err);
      }
    });
  }

  // Nowa metoda otwierająca dialog potwierdzenia usunięcia
  openConfirmDialog(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { message: 'Are you sure you want to delete this criterion?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteCriterion(id);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'in-progress';
      case 'COMPLETED':
        return 'completed';
      case 'NOT_STARTED':
        return 'not-started';
      default:
        return '';
    }
  }

  mapType(type: string): string {
    switch (type) {
      case 'REQUIRED': return 'Required';
      case 'EXPECTED': return 'Expected';
      case 'MEASURABLE_IMPLEMENTATION_INDICATORS': return 'Indicators';
      default: return type;
    }
  }

  onTypeChange(event: Event, id: number | undefined): void {
    if (id === undefined) {
      console.error('Missing criterion ID for type update');
      return;
    }

    const target = event.target as HTMLSelectElement;
    const newType = target.value as 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS';
    this.criteriaService.updateType(id, newType).subscribe({
      next: () => {
        console.log(`Type updated for ID ${id}`);
        this.loadCriteria();
      },
      error: err => {
        console.error(`Error updating type:`, err);
      }
    });
  }

  updateCriterionLevel(id: number, newLevel: string): Observable<any> {
    const url = `/pri/api/criteria-projects/${id}/level`;
    return this.http.patch(url, { levelOfRealization: newLevel });
  }

  updateCriterionComment(id: number, comment: string): void {
    this.criteriaService.updateComment(id, comment).subscribe({
      next: () => {
        console.log(`Updated comment for criterion ${id}`);
        this.loadCriteria();
      },
      error: err => console.error(`Error updating comment:`, err)
    });
  }

  updateCommentAndLevel(id: number, comment: string, level: string): void {
    this.criteriaService.updateCommentAndLevel(id, { comment, levelOfRealization: level }).subscribe({
      next: () => {
        console.log(`Updated comment and level for criterion ${id}`);
        this.loadCriteria();
      },
      error: err => console.error(`Error updating both:`, err)
    });
  }

  updateEnable(id: number, enable: boolean): void {
    this.criteriaService.updateEnableForModification(id, enable).subscribe({
      next: () => {
        console.log(`Updated enable flag for criterion ${id}`);
        this.loadCriteria();
      },
      error: err => console.error(`Error updating enable:`, err)
    });
  }

  onLevelChange(event: Event, id: number | undefined): void {
    if (id === undefined) {
      console.error('Missing criterion ID for level update');
      return;
    }

    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.criteriaService.updateLevel(id, value).subscribe({
      next: () => {
        console.log(`Level updated for ID ${id}`);
      },
      error: err => {
        console.error('Error updating level:', err);
      }
    });
  }

  onCommentChange(event: Event, id?: number): void {
    const comment = (event.target as HTMLInputElement).value.trim();
    if (!id) {
      console.error('Missing criterion ID for comment update');
      return;
    }

    this.criteriaService.updateComment(id, comment).subscribe({
      next: () => console.log(`Updated comment for criterion ${id}`),
      error: (err) => console.error('Error updating comment:', err)
    });
  }

  getTypeLabel(type: 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS'): string {
    switch (type) {
      case 'REQUIRED':
        return 'Required';
      case 'EXPECTED':
        return 'Expected';
      case 'MEASURABLE_IMPLEMENTATION_INDICATORS':
        return 'Indicators';
      default:
        return type;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
