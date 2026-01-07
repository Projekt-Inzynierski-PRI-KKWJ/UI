import {
  Component,
  OnInit
} from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import {
  Store
} from '@ngrx/store';
import {
  State
} from 'src/app/app.state';
import {
  first
} from 'rxjs';
import {
  Project
} from '../../models/project.model';
import {
  MatDialog
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import {
  Supervisor
} from '../../../../modules/user/models/supervisor.model';
import {
  ProjectMarketplaceDetailsComponent
} from '../project-marketplace-details/project-marketplace-details.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-marketplace',
  templateUrl: './project-marketplace.component.html',
  styleUrls: ['./project-marketplace.component.scss']
})
export class ProjectMarketplaceComponent implements OnInit {
  currentUser: any = null;
  isSupervisor: boolean = false;
  canOpenSupervisorAccept: boolean = false;
  searchTerm: string = '';
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  debugResponse: any = null;
  debugError: any = null;
  debugUrl: string = './pri/api/project-market/market?page=0&size=100';
  isLoading: boolean = false;
  userHeaders: any = {};
  showNewProjectDialog: boolean = false;
  newProjectForm: FormGroup;
  isSubmitting: boolean = false;
  loadingProjects: boolean = false;
  supervisors: any[] = [];

  constructor(
    private http: HttpClient,
    private store: Store < State > ,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.newProjectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      technologies: this.fb.array([this.fb.control('', Validators.required)]),
      contactData: ['', [Validators.required, Validators.email]],
      maxMembers: [3, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit() {
    this.loadProjects();

    this.store.select('user').pipe(first()).subscribe(user => {
      this.currentUser = user;
      const role = (user?.role || '').toString().toUpperCase();
      this.isSupervisor = !!user && (role === 'SUPERVISOR' || role === 'PROJECT_ADMIN' || role === 'COORDINATOR');
      this.canOpenSupervisorAccept = !!user && (role === 'SUPERVISOR' || role === 'COORDINATOR');
      this.userHeaders = {
        'study-year': user.actualYear,
        'index-number': user.indexNumber,
        'lang': user.lang
      };
      this.loadSupervisors();
    });
  }

  loadSupervisors() {
    this.http.get('./pri/user/supervisor', { headers: this.userHeaders }).subscribe({
      next: (resp: any) => {
        if (Array.isArray(resp)) this.supervisors = resp;
        else if (resp && resp.content && Array.isArray(resp.content)) this.supervisors = resp.content;
        else this.supervisors = [];
      },
      error: (err) => {
        console.error('Failed to load supervisors', err);
        this.supervisors = [];
      }
    });
  }

  openProjectDetails(projectId: number | string | undefined): void {
    if (!projectId) {
      console.error('Project ID is undefined');
      return;
    }

    const dialogRef = this.dialog.open(ProjectMarketplaceDetailsComponent, {
      width: '900px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        projectId: projectId
      },
      panelClass: 'centered-custom-modal',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated') {
        this.refreshProjects();
      }
    });
  }

  loadProjects() {
    this.loadingProjects = true;
    this.http.get('./pri/api/project-market/market?page=0&size=100')
      .subscribe({
        next: (response: any) => {
          console.log('Projects loaded:', response);

          if (response && response.content) {
            if (Array.isArray(response.content) && response.content.length > 0) {
              this.projects = response.content.map((project: any) => ({
                id: project.id,
                name: project.projectName,
                ownerDetails: project.ownerDetails,
                supervisor: this.createSupervisorFromOwner(project.ownerDetails),
                accepted: false,
                description: project.projectDescription,
                technologies: project.technologies || [],
                maxMembers: project.maxMembers,
                contactData: project.contactData,
                currentMembers: project.currentMembers || [],
                creationDate: project.creationDate,
                modificationDate: project.modificationDate,
                studyYear: project.studyYear
              }));
            } else {
              this.projects = [];
            }
          } else if (Array.isArray(response) && response.length > 0) {
            this.projects = response.map((project: any) => ({
              id: project.id,
              name: project.projectName,
              ownerDetails: project.ownerDetails,
              supervisor: this.createSupervisorFromOwner(project.ownerDetails),
              accepted: false,
              description: project.projectDescription,
              technologies: project.technologies || [],
              maxMembers: project.maxMembers,
              contactData: project.contactData,
              currentMembers: project.currentMembers || [],
              creationDate: project.creationDate,
              modificationDate: project.modificationDate,
              studyYear: project.studyYear
            }));
          } else {
            this.projects = [];
          }

          this.filteredProjects = [...this.projects];
          this.loadingProjects = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.projects = [];
          this.filteredProjects = [];
          this.loadingProjects = false;
        }
      });
  }

  private createSupervisorFromOwner(ownerDetails: any): Supervisor {
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

  refreshProjects() {
    this.loadProjects();
  }

  testBackendCall() {
    this.debugResponse = null;
    this.debugError = null;
    this.isLoading = true;

    this.http.get(this.debugUrl)
      .subscribe({
        next: (response) => {
          this.debugResponse = response;
          this.isLoading = false;
          console.log('Backend response:', response);
        },
        error: (error) => {
          this.debugError = error;
          this.isLoading = false;
          console.error('Backend error:', error);
        }
      });
  }

  searchProjects() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.technologies && p.technologies.some((tech: string) => tech.toLowerCase().includes(term)))
    );
  }

  get technologies(): FormArray {
    return this.newProjectForm.get('technologies') as FormArray;
  }

  addTechnology() {
    this.technologies.push(this.fb.control('', Validators.required));
  }

  removeTechnology(index: number) {
    if (this.technologies.length > 1) {
      this.technologies.removeAt(index);
    }
  }

  openAddProjectDialog() {
    this.showNewProjectDialog = true;
    this.newProjectForm.reset({
      name: '',
      description: '',
      contactData: '',
      maxMembers: 3
    });
    while (this.technologies.length > 1) {
      this.technologies.removeAt(1);
    }
    this.technologies.at(0).setValue('');
  }

  closeNewProjectDialog() {
    this.showNewProjectDialog = false;
    this.isSubmitting = false;
  }

  submitNewProject() {
    if (this.newProjectForm.invalid) {
      Object.keys(this.newProjectForm.controls).forEach(key => {
        this.newProjectForm.get(key)?.markAsTouched();
      });
      this.technologies.controls.forEach(ctrl => ctrl.markAsTouched());
      return;
    }

    this.isSubmitting = true;
    const formValue = this.newProjectForm.value;

    const projectData: any = {
      name: formValue.name,
      description: formValue.description,
      technologies: formValue.technologies.filter((t: string) => t.trim() !== ''),
      studyYear: this.userHeaders['study-year'] || '2024/2025',
      contactData: formValue.contactData,
      maxMembers: formValue.maxMembers
    };

    // Create project (do not auto-submit to supervisor)
    this.http.post('./pri/api/project-market/project', projectData)
      .subscribe({
        next: (response: any) => {
          console.log('Project created successfully:', response);
          this.snackBar.open('Projekt został pomyślnie dodany!', 'Zamknij', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.closeNewProjectDialog();
          this.refreshProjects();
        },
        error: (error) => {
          console.error('Failed to create project:', error);

          const errorMessage = error.error?.errorMessage || error.message || 'Wystąpił nieoczekiwany błąd';
          this.snackBar.open(`Błąd: ${errorMessage}`, 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          
          this.isSubmitting = false;
        }
      });
  }

  openMyApplications() {
    this.router.navigate(['/marketplace/applications']);
  }

  openMyProject() {
    this.router.navigate(['/marketplace/my-projects']);
  }

  openSupervisorAccept() {
    this.router.navigate(['/marketplace/supervisor-accept']);
  }
}