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
  debugUrl: string = './pri/project';
  isLoading: boolean = false;
  userHeaders: any = {};
  showNewProjectDialog: boolean = false;
  newProjectForm: FormGroup;
  isSubmitting: boolean = false;

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
    this.projects = [
      { id: 'P001', name: 'System rezerwacji sal', supervisor: { name: 'Dr Kowalski' } as any, accepted: true },
      { id: 'P002', name: 'Analiza danych pogodowych', supervisor: { name: 'Mgr Nowak' } as any, accepted: false }
    ];

    this.filteredProjects = [...this.projects];

    // Get user info for headers
    this.store.select('user').pipe(first()).subscribe(user => {
      this.userHeaders = {
        'study-year': user.actualYear,
        'index-number': user.indexNumber,
        'lang': user.lang
      };
    });
  }

  testBackendCall() {
    this.debugResponse = null;
    this.debugError = null;
    this.isLoading = true;

    // Note: Headers are automatically added by Angular's HTTP interceptor
    // This call will work the same as other frontend API calls
    this.http.get(this.debugUrl)
      .subscribe({
        next: (response) => {
          this.debugResponse = response;
          this.isLoading = false;
          console.log('Backend response:', response);
          console.log('Request was made with headers (auto-added by interceptor):', this.userHeaders);
        },
        error: (error) => {
          this.debugError = error;
          this.isLoading = false;
          console.error('Backend error:', error);
          console.error('Headers that should have been sent:', this.userHeaders);
        }
      });
  }

  searchProjects() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(p =>
      p.name.toLowerCase().includes(term)
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
    // Reset technologies array
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
          // Optionally refresh the project list here
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
