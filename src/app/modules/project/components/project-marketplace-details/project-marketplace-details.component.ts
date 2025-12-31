import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ApplyToProjectDialogComponent } from '../apply-to-project-dialog/apply-to-project-dialog.component';
import { ViewApplicationsDialogComponent } from '../view-applications-dialog/view-applications-dialog.component';

@Component({
  selector: 'project-marketplace-details',
  templateUrl: './project-marketplace-details.component.html',
  styleUrls: ['./project-marketplace-details.component.scss']
})
export class ProjectMarketplaceDetailsComponent implements OnInit, OnDestroy {
  project: any = null;
  isLoading: boolean = true;
  error: string | null = null;
  isEditMode: boolean = false;
  editProjectForm: FormGroup;
  isSubmitting: boolean = false;

  isOwner: boolean = false;
  isSupervisor: boolean = false;
  isStudent: boolean = false;
  canApply: boolean = false;

  currentUser: any = null;
  userHeaders: HttpHeaders = new HttpHeaders();
  private storeSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private store: Store<State>,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ProjectMarketplaceDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number }
  ) {
    this.editProjectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.minLength(3)]],
      projectDescription: ['', [Validators.required, Validators.minLength(10)]],
      technologies: this.fb.array([this.fb.control('', Validators.required)]),
      contactData: ['', [Validators.required, Validators.email]],
      maxMembers: [3, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    if (this.storeSubscription) {
      this.storeSubscription.unsubscribe();
    }
  }

  loadUserData(): void {
    this.storeSubscription = this.store.select('user').pipe(first()).subscribe(user => {
      this.currentUser = user;
      this.userHeaders = new HttpHeaders({
        'study-year': user.actualYear || '',
        'index-number': user.indexNumber || '',
        'lang': user.lang || 'pl'
      });

      this.loadProjectDetails();
    });
  }

  loadProjectDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get(`./pri/api/project-market/market/${this.data.projectId}`, {
      headers: this.userHeaders
    })
      .subscribe({
        next: (response: any) => {
          this.project = response;
          this.isLoading = false;

          this.checkUserPermissions();

          this.prefillForm();
        },
        error: (error) => {
          console.error('Error loading project details:', error);
          this.error = 'Nie udało się załadować szczegółów projektu.';
          this.isLoading = false;
        }
      });
  }

checkUserPermissions(): void {
  if (!this.currentUser || !this.project) {
    this.isOwner = false;
    this.isSupervisor = false;
    return;
  }
  
  console.log('Current user FULL:', JSON.stringify(this.currentUser, null, 2));
  console.log('Project owner:', this.project.ownerDetails);

  const userIndex = this.currentUser.indexNumber;

  const ownerEmail = this.project.ownerDetails?.email;

  const ownerIndex = ownerEmail ? ownerEmail.split('@')[0] : null;

  this.isOwner = userIndex === ownerIndex;

  if (!this.isOwner && this.project.currentMembers) {
    this.isOwner = this.project.currentMembers.some((member: any) => {
      const memberIndex = member.email ? member.email.split('@')[0] : null;
      return userIndex === memberIndex;
    });
  }

  this.isSupervisor = this.currentUser.role === 'supervisor' || 
                      this.currentUser.role === 'teacher' ||
                      this.currentUser.role === 'PROJECT_ADMIN' ||
                      this.currentUser.isSupervisor === true;
  
  this.isStudent = this.currentUser.role === 'STUDENT' || 
                   this.currentUser.role === 'student';
  
  // Can apply if: student AND not owner AND not already accepted
  this.canApply = this.isStudent && !this.isOwner && !this.project.accepted;
  
  if (this.currentUser.role === 'PROJECT_ADMIN') {
    console.log('User is PROJECT_ADMIN, granting edit permission');
    this.isOwner = true;
    this.isSupervisor = true;
  }
  
  console.log('User permissions:', {
    userIndex,
    ownerIndex,
    isOwner: this.isOwner,
    userRole: this.currentUser.role,
    isSupervisor: this.isSupervisor,
    isStudent: this.isStudent,
    canApply: this.canApply,
    ownerEmail
  });
}

  prefillForm(): void {
    if (!this.project) return;
    
    this.editProjectForm.patchValue({
      projectName: this.project.projectName || '',
      projectDescription: this.project.projectDescription || '',
      contactData: this.project.contactData || '',
      maxMembers: this.project.maxMembers || 3
    });

    const techArray = this.editProjectForm.get('technologies') as FormArray;
    techArray.clear();
    
    if (this.project.technologies && this.project.technologies.length > 0) {
      this.project.technologies.forEach((tech: string) => {
        techArray.push(this.fb.control(tech, Validators.required));
      });
    } else {
      techArray.push(this.fb.control('', Validators.required));
    }
  }

  get technologies(): FormArray {
    return this.editProjectForm.get('technologies') as FormArray;
  }

  addTechnology(): void {
    this.technologies.push(this.fb.control('', Validators.required));
  }

  removeTechnology(index: number): void {
    if (this.technologies.length > 1) {
      this.technologies.removeAt(index);
    }
  }

  enableEditMode(): void {
    this.isEditMode = true;
    this.prefillForm();
  }

  cancelEdit(): void {
    this.isEditMode = false;
  }

  submitProjectUpdate(): void {
    if (this.editProjectForm.invalid) {
      Object.keys(this.editProjectForm.controls).forEach(key => {
        this.editProjectForm.get(key)?.markAsTouched();
      });
      this.technologies.controls.forEach(ctrl => ctrl.markAsTouched());
      return;
    }

    event?.preventDefault();

    this.isSubmitting = true;
    const formValue = this.editProjectForm.value;
    
    const projectData = {
      id: this.project.id,
      projectName: formValue.projectName,
      projectDescription: formValue.projectDescription,
      technologies: formValue.technologies.filter((t: string) => t.trim() !== ''),
      contactData: formValue.contactData,
      maxMembers: formValue.maxMembers,
      accepted: false,
      modificationDate: new Date().toISOString()
    };

    console.log('Updating project with data:', projectData);
    console.log('Headers:', this.userHeaders.keys());

    this.http.put(`./pri/api/project-market/project/${this.project.id}`, projectData, {
      headers: this.userHeaders
    })
      .subscribe({
        next: (response) => {
          console.log('Project updated successfully:', response);
          this.isSubmitting = false;
          this.isEditMode = false;
          
          this.loadProjectDetails();

          this.dialogRef.close('updated');
        },
        error: (error) => {
          console.error('Failed to update project:', error);
          
          let errorMessage = 'Błąd podczas aktualizacji projektu.';
          if (error.status === 401) {
            errorMessage = 'Brak uprawnień do edycji tego projektu.';
          } else if (error.error?.errorMessage) {
            errorMessage = error.error.errorMessage;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          alert(errorMessage);
          this.isSubmitting = false;
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  joinMembers(members: any[]): string {
    if (!members || members.length === 0) return 'Brak członków';
    return members.map(member => 
      `${member.firstName} ${member.lastName}`
    ).join(', ');
  }

  applyToProject(): void {
    if (!this.canApply) {
      console.warn('User cannot apply to this project');
      return;
    }

    const dialogRef = this.dialog.open(ApplyToProjectDialogComponent, {
      width: '600px',
      data: {
        projectId: this.project.id,
        projectName: this.project.projectName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'applied') {
        // Optionally refresh or close
        this.dialogRef.close('applied');
      }
    });
  }

  viewApplications(): void {
    if (!this.isOwner) {
      console.warn('User is not the owner');
      return;
    }

    const dialogRef = this.dialog.open(ViewApplicationsDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        projectId: this.project.id,
        projectName: this.project.projectName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated') {
        // Optionally refresh project details
        this.loadProjectDetails();
      }
    });
  }
}