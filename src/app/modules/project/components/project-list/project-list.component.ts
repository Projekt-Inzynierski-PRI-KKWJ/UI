import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { getFilters, getProjects } from '../../state/project.selectors';
import { State } from 'src/app/app.state';
import { Router } from '@angular/router';
import { changeFilters, loadProjects } from '../../state/project.actions';
import { Project } from '../../models/project.model';
import { ExternalLinkService } from '../../services/external-link.service';

@Component({
  selector: 'project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnDestroy, OnInit {
  @Input() acceptedProjects!: string[];
  @Input() assignedProjects!: string[];
  @Input() page!: string;
  @Input() externalLinkColumnHeaders!: string[];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columns: string[] = ['name'];
  projects!: MatTableDataSource<Project>;
  unsubscribe$ = new Subject<void>();
  loading = true;

  constructor(
    private store: Store<State>,
    private router: Router,
    private externalLinkService: ExternalLinkService,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(loadProjects());

    combineLatest([
      this.externalLinkService.columnHeaders$,
      this.store.select(getProjects),
      this.store.select(getFilters),
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([externalLinkColumnHeaders, projects, filters]) => {
        if (!projects) {
          this.loading = false;
          return;
        }

        const mappedProjects = projects.map(project => ({
          ...project,
          supervisorName: project.supervisor.name,
          externalLinks: project.externalLinks
        }));

        this.externalLinkColumnHeaders = externalLinkColumnHeaders || [];

        // Tutaj łączymy kolumny z filtrów z dynamicznymi kolumnami linków
        this.columns = [...filters.columns, ...this.externalLinkColumnHeaders];

        const filteredProjects = mappedProjects.filter(project =>
          this.filterProjectBySearchValue(project, filters.searchValue) &&
          this.filterProjectByAcceptanceStatus(project, filters.acceptanceStatus) &&
          this.filterProjectBySupervisorIndexNumber(project, filters.supervisorIndexNumber) &&
          this.filterProjectByCriteriaMetStatus(project, filters.criteriaMetStatus)
        );

        this.projects = new MatTableDataSource<Project>(filteredProjects);
        this.projects.paginator = this.paginator;
        this.projects.sort = this.sort;

        this.loading = false;
      });
  }

  filterProjectBySearchValue(project: Project, searchValue: string): boolean {
    return project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      project.supervisor.name.toLowerCase().includes(searchValue.toLowerCase());
  }

  filterProjectByAcceptanceStatus(project: Project, acceptanceStatus?: boolean): boolean {
    return acceptanceStatus !== undefined ? project.accepted === acceptanceStatus : true;
  }

  filterProjectBySupervisorIndexNumber(project: Project, supervisorIndexNumber?: string): boolean {
    return supervisorIndexNumber !== undefined ? project.supervisor.indexNumber === supervisorIndexNumber : true;
  }

  filterProjectByCriteriaMetStatus(project: Project, criteriaMetStatus?: boolean): boolean {
    return criteriaMetStatus !== undefined ? project.criteriaMet === criteriaMetStatus : true;
  }

  isProjectAccepted(id: string): boolean {
    return this.acceptedProjects.includes(id);
  }

  isProjectAssigned(id: string): boolean {
    return !this.acceptedProjects.includes(id) && this.assignedProjects.includes(id);
  }

  navigateToDetails(projectId: string): void {
    this.router.navigate([{ outlets: { modal: `projects/details/${projectId}` } }]);
  }

  downloadExternalLinkFile(projectId: string, externalLinkId: string): void {
    const downloadUrl = this.externalLinkService.getExternalLinkFileDownloadUrl(projectId, externalLinkId);

    const link = document.createElement('a');
    link.href = downloadUrl;

    const project = this.projects.data.find(p => p.id === projectId);
    const externalLink = project?.externalLinks?.find(link => link.id === externalLinkId);
    if (externalLink?.originalFileName) {
      link.download = externalLink.originalFileName;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getSortedExternalLinks(project: Project): any[] {
    if (!project?.externalLinks) {
      return [];
    }
    return [...project.externalLinks].sort((a, b) => a.name.localeCompare(b.name));
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    this.store.dispatch(changeFilters({
      filters: {
        searchValue: '',
        supervisorIndexNumber: undefined,
        acceptanceStatus: undefined,
        columns: ['name', 'supervisorName', 'accepted'],  // Domyślne kolumny przy czyszczeniu
        criteriaMetStatus: undefined,
      }
    }));
  }
}
