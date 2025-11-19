import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute
} from '@angular/router';
import {
  Subject,
  takeUntil
} from 'rxjs';
import {
  ProjectCriteriaService
} from '../../services/project-criterion.service';
import {
  CriteriaProjectDTO
} from '../../models/project-criterion.model';
import {
  Observable
} from 'rxjs';
import {
  HttpClient
} from '@angular/common/http';
import {
  MatDialog
} from '@angular/material/dialog';
import {
  ConfirmDialogComponent
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { Store } from '@ngrx/store';
import { State } from '../../../../app.state';
import { UserState } from '../../../../modules/user/state/user.state';

@Component({
  selector: 'project-criteria',
  templateUrl: './project-criteria.component.html',
  styleUrls: ['./project-criteria.component.scss']
})
export class ProjectCriteriaComponent implements OnInit, OnDestroy {
  @Input() semester?: 'FIRST' | 'SECOND';
  @Input() type: 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS' | 'ALL' = 'ALL';
  projectId!: number;
  user!: UserState;
  criteriaList: CriteriaProjectDTO[] = [];
  private unsubscribe$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private criteriaService: ProjectCriteriaService,
    private http: HttpClient,
    private dialog: MatDialog,
    private store: Store<State>
  ) {}

  ngOnInit(): void {
    console.log('🔵 ProjectCriteriaComponent initialized');
    
    // Subskrypcja do stanu użytkownika
    this.store.select('user').pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      console.log('🔵 User state updated:', user);
      console.log('🔵 User role:', user?.role);
      console.log('🔵 Is user logged:', user?.logged);
      this.user = user;
      
      // Dodatkowe logi po przypisaniu usera
      console.log('🔵 this.user after assignment:', this.user);
      console.log('🔵 this.canDeleteCriteria value:', this.canDeleteCriteria);
    });

    this.activatedRoute.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.projectId = +params['id'];
      console.log('🔵 Project ID from route:', this.projectId);
      this.loadCriteria();
    });
  }

  // Getter sprawdzający czy użytkownik może usuwać kryteria
  get canDeleteCriteria(): boolean {
    const canDelete = this.user?.role === 'SUPERVISOR' || this.user?.role === 'COORDINATOR';
    console.log('🔵 canDeleteCriteria getter called:');
    console.log('   - this.user?.role:', this.user?.role);
    console.log('   - result:', canDelete);
    return canDelete;
  }

  loadCriteria(): void {
    console.log('🔵 Loading criteria for project:', this.projectId);
    this.criteriaService.getCriteriaByProjectId(this.projectId).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (criteria: CriteriaProjectDTO[]) => {
        console.log('🟢 Criteria loaded:', criteria.length, 'items');
        this.criteriaList = criteria.filter(c =>
          (!this.semester || c.semester === this.semester) &&
          (this.type === 'ALL' || c.type === this.type) &&
          (!this.semester || c.type !== 'MEASURABLE_IMPLEMENTATION_INDICATORS')
        );
        console.log('🟢 Filtered criteria:', this.criteriaList.length, 'items');
      },
      error: (err) => {
        console.error('🔴 Error loading criteria:', err);
      }
    });
  }

  deleteCriterion(id?: number): void {
    console.log('🔵 Attempting to delete criterion:', id);
    if (!id) {
      console.warn('🔴 Tried to delete criterion with undefined ID.');
      return;
    }

    this.http.delete(`/pri/api/criteria-projects/${id}`).subscribe({
      next: () => {
        console.log('🟢 Criterion deleted:', id);
        this.loadCriteria();
      },
      error: err => {
        console.error('🔴 Error deleting criterion:', err);
      }
    });
  }

  openConfirmDialog(id: number): void {
    console.log('🔵 Opening confirm dialog for criterion:', id);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        message: 'Are you sure you want to delete this criterion?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔵 Confirm dialog result:', result);
      if (result === true) {
        this.deleteCriterion(id);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'PARTIALLY_COMPLETED':
        return 'status-partially-completed';
      case 'COMPLETED':
        return 'status-completed';
      default:
        return '';
    }
  }

  mapType(type: string): string {
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

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PARTIALLY_COMPLETED':
        return 'Partially Completed';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  }

  updateCriterionLevel(id: number, newLevel: string): Observable<any> {
    const url = `/pri/api/criteria-projects/${id}/level`;
    return this.http.patch(url, {
      levelOfRealization: newLevel
    });
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
    this.criteriaService.updateCommentAndLevel(id, {
      comment,
      levelOfRealization: level
    }).subscribe({
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

  onToggleLock(id: number, newValue: boolean): void {
    this.updateEnable(id, newValue);
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
    console.log('🔵 ProjectCriteriaComponent destroyed');
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}