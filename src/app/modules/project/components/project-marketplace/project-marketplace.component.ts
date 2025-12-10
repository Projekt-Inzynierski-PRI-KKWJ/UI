import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { first } from 'rxjs';
import { Project } from '../../models/project.model';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'app-project-marketplace',
  templateUrl: './project-marketplace.component.html',
  styleUrls: ['./project-marketplace.component.scss']
})
export class ProjectMarketplaceComponent implements OnInit {
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

  constructor(
    private http: HttpClient,
    private store: Store<State>,
    private fb: FormBuilder
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

    // Get user info for headers
    this.store.select('user').pipe(first()).subscribe(user => {
      this.userHeaders = {
        'study-year': user.actualYear,
        'index-number': user.indexNumber,
        'lang': user.lang
      };
    });
  }

  // Dodaj tę metodę do ładowania projektów
  loadProjects() {
    this.loadingProjects = true;
    this.http.get('./pri/api/project-market/market?page=0&size=100')
      .subscribe({
        next: (response: any) => {
          console.log('Projects loaded:', response);
          
          if (response && response.content) {
            // Jeśli backend używa paginacji (Spring Page)
            this.projects = response.content.map((project: any) => ({
              id: project.id || project.projectId,
              name: project.name || project.title,
              supervisor: project.supervisor || { name: 'Brak przypisanego opiekuna' },
              accepted: project.accepted || project.status === 'ACCEPTED' || false,
              description: project.description,
              technologies: project.technologies || [],
              maxMembers: project.maxMembers || project.maxStudents || 1
            }));
          } else if (Array.isArray(response)) {
            // Jeśli backend zwraca bezpośrednio tablicę
            this.projects = response.map((project: any) => ({
              id: project.id || project.projectId,
              name: project.name || project.title,
              supervisor: project.supervisor || { name: 'Brak przypisanego opiekuna' },
              accepted: project.accepted || project.status === 'ACCEPTED' || false,
              description: project.description,
              technologies: project.technologies || [],
              maxMembers: project.maxMembers || project.maxStudents || 1
            }));
          }
          
          this.filteredProjects = [...this.projects];
          this.loadingProjects = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          // Fallback do przykładowych danych
          this.projects = [
            { id: 'P001', name: 'System rezerwacji sal', supervisor: { name: 'Dr Kowalski' } as any, accepted: true },
            { id: 'P002', name: 'Analiza danych pogodowych', supervisor: { name: 'Mgr Nowak' } as any, accepted: false }
          ];
          this.filteredProjects = [...this.projects];
          this.loadingProjects = false;
        }
      });
  }

  // Dodaj tę metodę do odświeżania listy po dodaniu projektu
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
    const projectData = {
      name: formValue.name,
      description: formValue.description,
      technologies: formValue.technologies.filter((t: string) => t.trim() !== ''),
      studyYear: this.userHeaders['study-year'] || '2024/2025',
      contactData: formValue.contactData,
      maxMembers: formValue.maxMembers
    };

    this.http.post('./pri/api/project-market/project', projectData)
      .subscribe({
        next: (response) => {
          console.log('Project created successfully:', response);
          this.closeNewProjectDialog();
          
          // Odśwież listę projektów po dodaniu nowego
          this.refreshProjects();
          
          // Możesz też dodać powiadomienie dla użytkownika
          alert('Projekt został pomyślnie dodany!');
        },
        error: (error) => {
          console.error('Failed to create project:', error);
          alert('Błąd podczas tworzenia projektu: ' + (error.error?.errorMessage || error.message));
          this.isSubmitting = false;
        }
      });
  }

  openMyApplications() {
    console.log('Moje wnioski');
  }

  openMyProject() {
    console.log('Mój projekt');
  }
}