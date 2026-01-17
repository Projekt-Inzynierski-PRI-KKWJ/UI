import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AreYouSureDialogComponent } from '../../../shared/are-you-sure-dialog/are-you-sure-dialog.component';
import { SelectSupervisorDialogComponent } from '../select-supervisor-dialog/select-supervisor-dialog.component';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ApplyToProjectDialogComponent } from '../apply-to-project-dialog/apply-to-project-dialog.component';
import { ViewApplicationsDialogComponent } from '../view-applications-dialog/view-applications-dialog.component';
import { Router } from '@angular/router';

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
  isCoordinator: boolean = false;
  canAcceptProjectAction: boolean = false;
  isStudent: boolean = false;
  canApply: boolean = false;
  canLeaveProject: boolean = false;

  currentUser: any = null;
  userHeaders: HttpHeaders = new HttpHeaders();
  private storeSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private store: Store<State>,
    private dialog: MatDialog,
    private router: Router,
    public dialogRef: MatDialogRef<ProjectMarketplaceDetailsComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number }
  ) {
    this.editProjectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.minLength(3)]],
      projectDescription: ['', [Validators.required, Validators.minLength(10)]],
      technologies: this.fb.array([this.fb.control('')]),
      contactData: ['', [Validators.required, Validators.email]],
      maxMembers: [3, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  submitToSupervisor(): void {
    if (!this.project) return;
    const dialogRef = this.dialog.open(SelectSupervisorDialogComponent, {
      width: '600px',
      data: { projectId: this.project.id, headers: this.userHeaders }
    });

    dialogRef.afterClosed().subscribe((selectedSupervisorId: any) => {
      if (!selectedSupervisorId) return;

      this.isSubmitting = true;

      let headers = this.userHeaders;
      if (this.currentUser && this.currentUser.token && typeof headers?.set === 'function') {
        headers = headers.set('Authorization', `Bearer ${this.currentUser.token}`);
      }

      const url = `./pri/api/project-market/market/${this.project.id}/submit/${selectedSupervisorId}`;

      this.http.patch(url, null, { headers: headers, withCredentials: true })
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.dialogRef.close('updated');
          },
          error: (err) => {
            console.error('Submit to supervisor failed', err);
            this.isSubmitting = false;
            const msg = err?.error?.errorMessage || 'Nie udało się wysłać zgłoszenia';
            this.snackBar.open(msg, 'OK', { duration: 4000,
              panelClass: ['error-snackbar'] });
          }
        });
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
        'study-year': user?.actualYear || '',
        'index-number': user?.indexNumber || '',
        'lang': user?.lang || 'pl'
      });

      // Prefill email if available and not already set
      if (user?.email && !this.editProjectForm.get('contactData')?.value) {
        this.editProjectForm.patchValue({ contactData: user.email });
      }

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

  // Use indexNumber directly from ownerDetails
  const ownerIndex = this.project.ownerDetails?.indexNumber;

  this.isOwner = userIndex === ownerIndex;

  // Also check if user is the ADMIN in currentMembers list (not just any member!)
  if (!this.isOwner && this.project.currentMembers) {
    const currentUserMember = this.project.currentMembers.find((member: any) => 
      userIndex === member.indexNumber
    );
    // Only set isOwner if this user is the admin
    if (currentUserMember?.isAdmin) {
      this.isOwner = true;
    }
  }

  const role = (this.currentUser.role || '').toString().toUpperCase();
  this.isSupervisor = role === 'SUPERVISOR' || this.currentUser.isSupervisor === true || role === 'TEACHER' || role === 'PROJECT_ADMIN';
  this.isCoordinator = role === 'COORDINATOR';

  // Only supervisors and coordinators should be able to accept projects
  this.canAcceptProjectAction = (role === 'SUPERVISOR' || role === 'COORDINATOR' || this.currentUser.isSupervisor === true);
  
  this.isStudent = this.currentUser.role === 'STUDENT' || 
                   this.currentUser.role === 'student';
  
  // Determine if user is a member (in currentMembers list)
  const isMember = this.project.currentMembers?.some((member: any) => 
    userIndex === member.indexNumber) || false;
  
  // Check if project is active and has available slots
  const projectStatus = (this.project.status || '').toString().toUpperCase();
  const isProjectActive = projectStatus === 'ACTIVE' || projectStatus === '';
  const hasAvailableSlots = this.hasAvailableSlots();
  
  // Can apply if: student AND not a member AND project not approved AND project is active AND has slots
  this.canApply = this.isStudent && !isMember && !this.isProjectApproved() && isProjectActive && hasAvailableSlots;
  
  // Can leave if: student AND is member BUT NOT owner AND project not approved
  this.canLeaveProject = this.isStudent && isMember && !this.isOwner && !this.isProjectApproved();
  
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
    canLeaveProject: this.canLeaveProject,
    projectStatus: this.project.status
  });
}

isProjectApproved(): boolean {
  return this.project?.status === 'APPROVED_BY_SUPERVISOR';
}

isProjectActive(): boolean {
  return this.project?.status === 'ACTIVE';
}

canViewSupervisorFeedback(): boolean {
  // Supervisors and coordinators can always see feedback
  if (this.isSupervisor || this.isCoordinator) {
    return true;
  }
  
  // Students can only see feedback if they are project members
  if (this.isStudent) {
    const userIndex = this.currentUser?.indexNumber;
    if (!userIndex) return false;
    
    // Check if user is the owner
    if (this.isOwner) return true;
    
    // Check if user is in currentMembers list
    return this.project.currentMembers?.some((member: any) => 
      userIndex === member.indexNumber) || false;
  }
  
  return false;
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
        techArray.push(this.fb.control(tech));
      });
    } else {
      techArray.push(this.fb.control(''));
    }
  }

  get technologies(): FormArray {
    return this.editProjectForm.get('technologies') as FormArray;
  }

  addTechnology(): void {
    this.technologies.push(this.fb.control(''));
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

    // preventDefault is not available in this context
    this.isSubmitting = true;
    const formValue = this.editProjectForm.value;
    
    const projectData = {
      name: formValue.projectName,
      description: formValue.projectDescription,
      technologies: formValue.technologies.filter((t: string) => t.trim() !== ''),
      contactData: formValue.contactData,
      maxMembers: formValue.maxMembers,
      studyYear: this.project.studyYear || this.currentUser?.actualYear || ''
    };

    console.log('Updating project with data:', projectData);
    // Ensure Authorization header present when available and include credentials (cookies)
    let headers = this.userHeaders;
    if (this.currentUser && this.currentUser.token && typeof headers?.set === 'function') {
      headers = headers.set('Authorization', `Bearer ${this.currentUser.token}`);
    }

    console.log('Headers keys:', headers.keys ? headers.keys() : headers);

    this.http.put(`./pri/api/project-market/project/${this.project.id}`, projectData, {
      headers: headers,
      withCredentials: true
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

  leaveProject(): void {
    const confirmDialogRef = this.dialog.open(AreYouSureDialogComponent, {
      width: '400px',
      data: {
        title: 'Leave Project',
        message: 'Are you sure you want to leave this project? This action cannot be undone.'
      }
    });

    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.http.delete(`./pri/api/project-market/market/project/${this.project.id}/leave`, {
          headers: this.userHeaders
        }).subscribe({
          next: () => {
            this.snackBar.open('You have left the project', 'OK', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close('updated');
          },
          error: (error) => {
            const errorMessage = error.error?.errorMessage || error.message || 'Failed to leave project';
            this.snackBar.open(`Error: ${errorMessage}`, 'OK', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  kickMember(studentId: number): void {
    const confirmDialogRef = this.dialog.open(AreYouSureDialogComponent, {
      width: '400px',
      data: {
        title: 'Kick Member',
        message: 'Are you sure you want to remove this member from the project?'
      }
    });

    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.http.delete(`./pri/api/project-market/market/${this.project.id}/kick/${studentId}`, {
          headers: this.userHeaders
        }).subscribe({
          next: () => {
            this.snackBar.open('Member has been removed', 'OK', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadProjectDetails();
          },
          error: (error) => {
            const errorMessage = error.error?.errorMessage || error.message || 'Failed to remove member';
            this.snackBar.open(`Error: ${errorMessage}`, 'OK', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
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

  hasAvailableSlots(): boolean {
    if (!this.project) return false;
    const availableSlots = this.project.availableSlots !== undefined 
      ? this.project.availableSlots 
      : (this.project.maxMembers - (this.project.currentMembers?.length || 0));
    return availableSlots > 0;
  }

  openFullProjectDetails(): void {
    if (!this.project || !this.project.accepted || !this.project.projectId) {
      console.error('Cannot open full details: project not approved or project ID missing');
      return;
    }
    this.dialogRef.close();
    this.router.navigate([{outlets: {modal: `projects/details/${this.project.projectId}`}}]);
  }
}