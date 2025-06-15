import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProjectCriteriaService } from '../../services/project-criterion.service';
import { CriteriaProjectDTO } from '../../models/project-criterion.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'project-criteria',
  templateUrl: './project-criteria.component.html',
  styleUrls: ['./project-criteria.component.scss']
})
export class ProjectCriteriaComponent implements OnInit, OnDestroy {
  projectId!: number;
  criteriaList: CriteriaProjectDTO[] = [];
  private unsubscribe$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private criteriaService: ProjectCriteriaService,
    private http: HttpClient
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
        this.criteriaList = criteria;
      },
      error: (err) => {
        console.error('Error loading criteria:', err);
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

  onLevelChange(event: Event, id: number): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.criteriaService.updateLevel(id, value).subscribe(() => {
      console.log(`Level updated for ID ${id}`);
    });
  }

  

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
