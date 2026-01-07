import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { State } from 'src/app/app.state';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ProjectMarketplaceDetailsComponent } from '../project-marketplace-details/project-marketplace-details.component';
import { AreYouSureDialogComponent } from '../../../shared/are-you-sure-dialog/are-you-sure-dialog.component';

@Component({
  selector: 'app-project-marketplace-supervisor-accept',
  templateUrl: './project-marketplace-supervisor-accept.component.html',
  styleUrls: ['./project-marketplace-supervisor-accept.component.scss']
})
export class ProjectMarketplaceSupervisorAcceptComponent implements OnInit {
  projects: any[] = [];
  loading = false;
  userHeaders: HttpHeaders = new HttpHeaders();
  currentUser: any = null;
  searchTerm: string = '';
  filteredProjects: any[] = [];

  constructor(
    private http: HttpClient,
    private store: Store<State>,
    private snackBar: MatSnackBar,
    private location: Location,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.store.select('user').pipe(first()).subscribe(user => {
      this.userHeaders = new HttpHeaders({
        'study-year': user.actualYear || '',
        'index-number': user.indexNumber || '',
        'lang': user.lang || 'pl'
      });

      this.currentUser = user;

      this.loadSupervisorProjects();
    });
  }

  loadMarketplaceProjects(): void {
    this.loading = true;
    this.http.get('./pri/api/project-market/market?page=0&size=200', { headers: this.userHeaders })
      .subscribe({
        next: (resp: any) => {
          console.log('Marketplace response for supervisor view:', resp);
          let items: any[] = [];
          if (resp && resp.content && Array.isArray(resp.content)) items = resp.content;
          else if (Array.isArray(resp)) items = resp;

          this.projects = items.map(p => this.mapProject(p));
          this.filteredProjects = [...this.projects];
          console.log('Loaded marketplace projects:', this.projects.length);
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load marketplace projects', err);
          this.snackBar.open('Błąd podczas ładowania projektów', 'Zamknij', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  private createSupervisorFromOwner(ownerDetails: any) {
    if (!ownerDetails) {
      return {
        name: 'Brak właściciela',
        email: '',
        indexNumber: '',
        initials: '',
        id: ''
      };
    }

    const firstName = ownerDetails.firstName || '';
    const lastName = ownerDetails.lastName || '';
    const email = ownerDetails.email || '';

    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    const initials = `${firstInitial}${lastInitial}`;

    const indexNumber = ownerDetails.indexNumber || email.split('@')[0] || '';
    const id = ownerDetails.id || indexNumber || '';

    return {
      name: `${firstName} ${lastName}`.trim(),
      email: email,
      indexNumber: indexNumber,
      initials: initials,
      id: id,
      accepted: false
    };
  }

  private mapProject(project: any) {
    const status = this.normalizeStatus(project.status || project.marketStatus || project.projectMarketStatus || project.marketplaceStatus || project.state);
    const accepted = status === 'APPROVED_BY_SUPERVISOR' ? true : (project.accepted === true || project.accepted === 'true' || false);

    return {
      id: project.id,
      status,
      name: project.projectName || project.name,
      ownerDetails: project.ownerDetails || project.owner || null,
      supervisor: this.createSupervisorFromOwner(project.ownerDetails || project.owner || {}),
      accepted,
      description: project.projectDescription || project.description,
      technologies: project.technologies || [],
      maxMembers: project.maxMembers,
      contactData: project.contactData,
      currentMembers: project.currentMembers || [],
      creationDate: project.creationDate || project.creation_date,
      modificationDate: project.modificationDate || project.modification_date,
      studyYear: project.studyYear
    };
  }

  private normalizeStatus(status: any): string {
    return (status || '').toString().toUpperCase();
  }

  loadSupervisorProjects(): void {
    this.loading = true;
    this.http.get('./pri/api/project-market/supervisor/projects?page=0&size=100', { headers: this.userHeaders })
      .subscribe({
        next: (resp: any) => {
          console.log('Supervisor projects response:', resp);

          let items: any[] = [];
          if (resp && resp.content && Array.isArray(resp.content)) {
            items = resp.content;
          } else if (resp && Array.isArray(resp)) {
            items = resp;
          } else if (resp && resp.data && Array.isArray(resp.data)) {
            items = resp.data;
          } else if (resp && resp.projects && Array.isArray(resp.projects)) {
            items = resp.projects;
          } else {
            items = [];
          }

          console.log('Parsed supervisor projects items count:', items.length);
          // map items to normalized project shape (like loadProjects)
          this.projects = items.map(p => this.mapProject(p));
          this.filteredProjects = [...this.projects];
          // fallback: if backend returned no supervisor projects, try loading marketplace and filter locally
          if (this.projects.length === 0) {
            console.log('Supervisor endpoint returned empty, falling back to marketplace filter');
            this.http.get('./pri/api/project-market/market?page=0&size=200', { headers: this.userHeaders }).subscribe({
              next: (marketResp: any) => {
                let marketItems: any[] = [];
                if (marketResp && marketResp.content && Array.isArray(marketResp.content)) marketItems = marketResp.content;
                else if (Array.isArray(marketResp)) marketItems = marketResp;

                const userIndex = (this.currentUser?.indexNumber || (this.currentUser?.email || '').split('@')[0] || '').toString().toLowerCase();

                const matched = marketItems.filter(p => {
                  const ownerEmail = p.ownerDetails?.email || p.ownerEmail || '';
                  const supervisorEmail = p.supervisor?.email || p.supervisorEmail || '';
                  const ownerIndex = ownerEmail ? ownerEmail.split('@')[0] : '';
                  const supIndex = supervisorEmail ? supervisorEmail.split('@')[0] : '';
                  return [ownerIndex, supIndex, (p.ownerDetails?.indexNumber || '')].some(val => val.toString().toLowerCase() === userIndex);
                }).map(p => this.mapProject(p));

                this.projects = matched;
                this.filteredProjects = [...this.projects];
                console.log('Fallback matched projects count:', this.projects.length);
              },
              error: err => console.error('Fallback marketplace load failed', err)
            });
          }
          console.log('this.projects.length=', this.projects.length, 'this.filteredProjects.length=', this.filteredProjects.length);
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load supervisor projects', err);
          this.snackBar.open('Błąd podczas ładowania projektów', 'Zamknij', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  acceptProject(project: any): void {
    if (!this.isPending(project)) {
      this.snackBar.open('Projekt nie oczekuje na decyzję opiekuna', 'OK', { duration: 2500 });
      return;
    }

    const dialogRef = this.dialog.open(AreYouSureDialogComponent, { data: { actionKey: 'confirm_accept_project', actionName: 'Potwierdź akceptację projektu' } });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.http.patch(`./pri/api/project-market/supervisor/${project.id}/approve`, {}, { headers: this.userHeaders, withCredentials: true })
      .subscribe({
        next: () => {
          project.accepted = true;
          project.status = 'APPROVED_BY_SUPERVISOR';
          this.snackBar.open('Projekt zaakceptowany', 'OK', { duration: 2500 });
          this.loadSupervisorProjects();
        },
        error: (err) => {
          console.error('Accept failed', err);
          this.snackBar.open('Nie udało się zaakceptować projektu', 'OK', { duration: 3000 });
        }
      });
    });
  }

  rejectProject(project: any): void {
    if (!this.isPending(project)) {
      this.snackBar.open('Projekt nie oczekuje na decyzję opiekuna', 'OK', { duration: 2500 });
      return;
    }

    const dialogRef = this.dialog.open(AreYouSureDialogComponent, { data: { actionKey: 'confirm_reject_project', actionName: 'Potwierdź odrzucenie projektu' } });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.http.patch(`./pri/api/project-market/supervisor/${project.id}/reject`, {}, { headers: this.userHeaders, withCredentials: true })
      .subscribe({
        next: () => {
          project.accepted = false;
          project.status = 'REJECTED_BY_SUPERVISOR';
          this.snackBar.open('Projekt odrzucony', 'OK', { duration: 2500 });
          this.loadSupervisorProjects();
        },
        error: (err) => {
          console.error('Reject failed', err);
          this.snackBar.open('Nie udało się odrzucić projektu', 'OK', { duration: 3000 });
        }
      });
    });
  }

  openProjectDetails(projectId: number | string | undefined): void {
    if (!projectId) return;

    const dialogRef = this.dialog.open(ProjectMarketplaceDetailsComponent, {
      width: '900px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { projectId },
      panelClass: 'centered-custom-modal',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated' || result === 'applied') {
        this.loadSupervisorProjects();
      }
    });
  }

    goBack(): void {
      this.location.back();
    }

    onSearchChange(): void {
      const term = this.searchTerm?.toLowerCase() || '';
      this.filteredProjects = this.projects.filter(p => {
        const name = (p.projectName || p.name || '').toString().toLowerCase();
        const owner = ((p.ownerDetails?.firstName || '') + ' ' + (p.ownerDetails?.lastName || '')).toLowerCase();
        const techs = (p.technologies || []).join(' ').toLowerCase();
        return name.includes(term) || owner.includes(term) || techs.includes(term);
      });
    }

    formatDate(dateStr: string): string {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return d.toLocaleDateString('pl-PL');
    }

    isPending(project: any): boolean {
      return this.normalizeStatus(project?.status) === 'SENT_FOR_APPROVAL_TO_SUPERVISOR';
    }

    getStatusColor(project: any): string {
      const status = this.normalizeStatus(project?.status);
      if (status === 'APPROVED_BY_SUPERVISOR' || project.accepted) return '#2e7d32';
      if (status === 'REJECTED_BY_SUPERVISOR') return '#c62828';
      return '#f57c00';
    }

    getStatusIcon(project: any): string {
      const status = this.normalizeStatus(project?.status);
      if (status === 'APPROVED_BY_SUPERVISOR' || project.accepted) return 'check_circle';
      if (status === 'REJECTED_BY_SUPERVISOR') return 'cancel';
      return 'pending';
    }

    getStatusLabel(project: any): string {
      const status = this.normalizeStatus(project?.status);
      if (status === 'APPROVED_BY_SUPERVISOR' || project.accepted) return 'ZAAKCEPTOWANY';
      if (status === 'REJECTED_BY_SUPERVISOR') return 'ODRZUCONY';
      return 'OCZEKUJE';
    }
}
