import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Observable, Subject, map, startWith, takeUntil } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { Student } from 'src/app/modules/user/models/student.model';
import { ActivatedRoute, Router } from '@angular/router';
import { UserState } from 'src/app/modules/user/state/user.state';
import { Supervisor } from 'src/app/modules/user/models/supervisor.model';
import { State } from 'src/app/app.state';
import { Store } from '@ngrx/store';
import { addProject, addProjectSuccess, addProjectFailure, updateProject, updateProjectSuccess, updateProjectFailure } from '../../state/project.actions';
import { Actions, ofType } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExternalLink } from '../../models/external-link.model';
import { ProjectDetails } from '../../models/project.model';
import { ExternalLinkService } from '../../services/external-link.service';

@Component({
  selector: 'project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredStudents!: Observable<Student[]>;
  technologies: string[] = [];
  technologyCtrl = new FormControl('');
  selectedMembers: Student[] = []
  memberInput = new FormControl('');
  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    members: this.fb.array([]),
    technologies: new FormControl<string[]>([], [Validators.required]),
    supervisorIndexNumber: ['', Validators.required],
    projectAdmin: ['', Validators.required],
    externalLinks: this.fb.array<ExternalLink>([]),
  });
  projectDetails?: ProjectDetails;
  user!: UserState;
  students!: Student[];
  supervisors!: Supervisor[];
  unsubscribe$ = new Subject();
  comingFromDetailsPage: boolean = false;

  // External link file upload state
  externalLinkFiles: { [key: string]: File } = {};
  externalLinkModes: { [key: string]: 'URL' | 'FILE' } = {};
  
  // History toggle state
  expandedHistoryIds = new Set<string>();

  // Loading state to prevent duplicate submissions
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private store: Store<State>,
    private actions$: Actions,
    private _snackbar: MatSnackBar,
    private router: Router,
    private externalLinkService: ExternalLinkService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.data.pipe(takeUntil(this.unsubscribe$)).subscribe(
      ({projectDetails, user, students, supervisors}) => {
      this.projectDetails = projectDetails;
      this.user = user;
      this.students = students;
      this.supervisors = supervisors;

      if(this.projectDetails){
        this.projectForm.controls.name.setValue(this.projectDetails.name);
        this.projectForm.controls.description.setValue(this.projectDetails.description);
        this.projectDetails.students.forEach(student => {
          this.members.push(this.fb.group({
            ...student,
            role: [student.role]
          }));
          this.selectedMembers.push(student);
        })
        
        // Sort links alphabeticallybefore adding to form
        const sortedExternalLinks = this.projectDetails.externalLinks?.slice().sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        sortedExternalLinks?.forEach(externalLink => {
          this.externalLinks.controls.push(this.fb.group({
            id: externalLink.id,
            url: externalLink.url,
            name: externalLink.name,
            columnHeader: externalLink.columnHeader,
            deadline: externalLink.deadline,
            contentType: externalLink.contentType,
            linkType: externalLink.linkType,
            originalFileName: externalLink.originalFileName,
            fileSize: externalLink.fileSize,
            creationDate: externalLink.creationDate,
            modificationDate: externalLink.modificationDate
          }));
          
          // Set mode based on existing data
          this.externalLinkModes[externalLink.id] = externalLink.linkType === 'INTERNAL' ? 'FILE' : 'URL';
        });
        this.projectForm.controls.projectAdmin.setValue(this.projectDetails.admin);
        this.projectForm.controls.supervisorIndexNumber.setValue(this.projectDetails.supervisor.indexNumber);
        this.projectForm.controls.technologies.setValue(this.projectDetails.technologies);
        this.technologies = this.projectDetails.technologies;
      } else {
        if(user.role !== 'COORDINATOR'){
          this.projectForm.controls.projectAdmin.setValue(this.user.indexNumber);
        
        }

        if(user.role !== 'COORDINATOR'){
          this.members.push(this.fb.group({
            name: this.user.name,
            indexNumber: this.user.indexNumber,
            email: this.students.find(student => student.indexNumber === user.indexNumber)?.email,
            accepted: true,
            role: [null]
          }));
        }
      }
    })

    this.activatedRoute.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.comingFromDetailsPage = params['comingFromDetailsPage'];
    });

    this.filteredStudents = this.memberInput.valueChanges.pipe(
      startWith(null),
      map((value: string | null) => this.filterStudents(value || ''))
    )
  }

  filterStudents(value: string | Student): Student[] {
    if (typeof value === "object") return this.students
    const filteredValue = value.toLowerCase()
    return this.students.filter(student =>
      (
        student.name.toLowerCase().includes(filteredValue) || 
        student.email.toLowerCase().includes(filteredValue) || 
        student.indexNumber.toLowerCase().includes(filteredValue)
      ) 
      &&
      this.selectedMembers.findIndex(member => member.indexNumber === student.indexNumber) === -1
      &&
      student.indexNumber !== this.user.indexNumber
      &&
      (
        !this.projectDetails 
          ? !student.accepted 
          : (!student.accepted ||
              (this.projectDetails.students.findIndex(pdStudent => pdStudent.indexNumber === student.indexNumber) !== -1)
            )
      )
    )
  }

  onMemberSelect(member: Student): void {
    this.members.push(this.fb.group({
      ...member,
      role: [null]
    }));
    this.selectedMembers.push(member);
    this.memberInput.reset()
  }

  removeMember(member: AbstractControl) {
    let index = this.members.controls.findIndex(iteratedMember => iteratedMember === member)
    if (index !== -1) this.members.removeAt(index)

    index = this.selectedMembers.findIndex(iteratedMember => iteratedMember.email === this.getMemberData(member).email)
    if (index !== -1) this.selectedMembers.splice(index, 1)

    this.memberInput.reset()
  }

  get members() {
    return this.projectForm.get('members') as FormArray;
  }

  getMemberData(member: AbstractControl): { name: string, email: string, indexNumber: string, role: FormControl } {
    return {
      name: member.get('name')?.value,
      email: member.get('email')?.value,
      indexNumber: member.get('indexNumber')?.value,
      role: member.get('role') as FormControl
    }
  }

  addTechnology(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && this.technologies.findIndex(t => t.toLowerCase() === value.toLowerCase()) === -1) {
      this.technologies.push(value)
    }
    event.chipInput!.clear();
  }

  removeTechnology(technology: string): void {
    this.technologies.splice(this.technologies.indexOf(technology), 1);
  }

  getErrorMessage(controlName: string): string {
    if (this.projectForm.get(controlName)?.hasError('required')) {
      return 'You must enter a value';
    }
    return ''
  }

  navigateBack(): void {
    if(this.comingFromDetailsPage){
      this.router.navigate([{outlets: { modal: `projects/details/${this.projectDetails!.id}` }}]) 
    } else {
      this.router.navigate([{outlets: { modal: null }}]) 
    }
  }

  get acceptedMembers(): Student[]{
    if(this.projectDetails){
      return this.projectDetails.students.slice().filter(student => student.accepted)
    } else {
      return this.user.role === 'COORDINATOR' ? this.selectedMembers : []
    }
  }


  get showSupervisorField() {
    return this.projectDetails?.accepted 
      ? this.user.role === 'COORDINATOR'
      : true
  }

  get showProjectAdminField() {
    return this.user.role === 'COORDINATOR' || 
      (
        this.projectDetails && 
        (this.projectDetails?.accepted 
          ? (this.user.role === 'SUPERVISOR')
          : this.projectDetails)
      )
  }

  get showMembersField() {
    return this.projectDetails?.accepted 
      ? this.user.role === 'COORDINATOR'
      : true
  }

  get externalLinks(): FormArray {
    return this.projectForm.get('externalLinks') as FormArray;
  }

  getExternalLinkFormControl(externalLink: AbstractControl): {name: string, deadline: string, url: FormControl} {
    return {
      name: externalLink.get('name')?.value,
      deadline: externalLink.get('deadline')?.value,
      url: externalLink.get('url') as FormControl
    }
  }

  // External link file upload methods
  onExternalLinkModeChange(externalLinkId: string, mode: 'URL' | 'FILE'): void {
    this.externalLinkModes[externalLinkId] = mode;
    if (mode === 'URL') {
      // Clear file if switching to URL mode
      delete this.externalLinkFiles[externalLinkId];
    }
  }

  onExternalLinkFileSelect(event: any, externalLinkId: string): void {
    const file: File = event.target.files[0];
    if (file) {
      this.externalLinkFiles[externalLinkId] = file;
      console.log(`File selected for external link ${externalLinkId}:`, file.name);
    } else {
      console.error(`No file selected for external link ${externalLinkId}`);
    }
  }

  downloadExternalLinkFile(externalLinkId: string): void {
    if (this.projectDetails?.id) {
      const downloadUrl = this.externalLinkService.getExternalLinkFileDownloadUrl(
        this.projectDetails.id, 
        externalLinkId
      );
      
      // Create a temporary a element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from external link data
      const externalLink = this.getExternalLinkById(externalLinkId);
      if (externalLink?.originalFileName) {
        link.download = externalLink.originalFileName;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  deleteExternalLinkFile(externalLinkId: string): void {
    if (this.projectDetails?.id) {
      this.externalLinkService.deleteExternalLinkFile(this.projectDetails.id, externalLinkId)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          // Reset to URL mode
          this.externalLinkModes[externalLinkId] = 'URL';
          // Clear the form
          const control = this.getExternalLinkControlById(externalLinkId);
          if (control) {
            control.get('url')?.setValue('');
            control.get('linkType')?.setValue('EXTERNAL');
            control.get('originalFileName')?.setValue(null);
            control.get('fileSize')?.setValue(null);
            control.get('contentType')?.setValue(null);
          }
          this._snackbar.open('File deleted successfully', 'close');
        });
    }
  }

  private getExternalLinkById(externalLinkId: string): ExternalLink | undefined {
    return this.projectDetails?.externalLinks?.find(link => link.id === externalLinkId);
  }

  private getExternalLinkControlById(externalLinkId: string): AbstractControl | null {
    return this.externalLinks.controls.find(control => 
      control.get('id')?.value === externalLinkId) || null;
  }

  // Handle file uploads on submit
  onSubmit(): void {
    if (this.projectForm.valid && !this.isSubmitting) {
      // Disable button to prevent duplicate submissions
      this.isSubmitting = true;
      
      let projectDetails: ProjectDetails = {
        id: this.projectDetails?.id,
        name: this.projectForm.controls.name.value!,
        description: this.projectForm.controls.description.value!,
        students: this.members.controls.map((control: any) => { return {
          name: control.controls.name.value,
          indexNumber: control.controls.indexNumber.value,
          email: control.controls.email.value,
          role: control.controls.role.value
        }}),
        externalLinks: this.externalLinks.controls.map((control: any) => { return {
          id: control.controls.id.value,
          url: control.controls.url.value,
          name: control.controls.name.value,
          columnHeader: control.controls.columnHeader.value,
          deadline: control.controls.deadline.value,
          contentType: this.externalLinkModes[control.controls.id.value] === 'FILE' ? 'file' : undefined,
          linkType: this.externalLinkModes[control.controls.id.value] === 'FILE' ? 'INTERNAL' : 'EXTERNAL',
          originalFileName: control.controls.originalFileName?.value,
          fileSize: control.controls.fileSize?.value
        }}),
        technologies: this.projectForm.controls.technologies.value!,
        admin: this.projectForm.controls.projectAdmin.value!,
        accepted: this.user.role === 'COORDINATOR' || (this.projectDetails ? this.projectDetails?.accepted! : false),
        confirmed: this.user.role === 'COORDINATOR' || (this.projectDetails ? this.projectDetails?.confirmed! : false),
        supervisor: this.supervisors.find(
          supervisor => supervisor.indexNumber === this.projectForm.controls.supervisorIndexNumber.value
        )!
      }

      if(this.projectDetails){
        this.store.dispatch(updateProject({project: projectDetails}))
        this.actions$.pipe(ofType(updateProjectSuccess),takeUntil(this.unsubscribe$)).subscribe(() => {
          // Re-enable button
          this.isSubmitting = false;
          // Upload files after project update
          this.uploadPendingFiles();
          this._snackbar.open('Project successfully updated', 'close');
          // Navigation to project overview handled in uploadPendingFiles()
        });
        this.actions$.pipe(ofType(updateProjectFailure),takeUntil(this.unsubscribe$)).subscribe(() => {
          // Re-enable button
          this.isSubmitting = false;
          this._snackbar.open('Something went wrong while updating the project', 'close');
        });
      } else {
        this.store.dispatch(addProject({project: projectDetails, userRole: this.user.role}))
        this.actions$.pipe(ofType(addProjectSuccess),takeUntil(this.unsubscribe$)).subscribe((project) => {
          // Re-enable button
          this.isSubmitting = false;
          // Upload files after project creation
          this.uploadPendingFiles();
          this._snackbar.open('Project successfully created', 'close');
          // Navigation to project overview handled in uploadPendingFiles()
        });
        this.actions$.pipe(ofType(addProjectFailure),takeUntil(this.unsubscribe$)).subscribe((action) => {
          // Re-enable button
          this.isSubmitting = false;
          const errorMessage = (action.error as any)?.status === 412 
            ? 'Please make sure that all necessary files have been uploaded before creating the project'
            : 'Something went wrong while creating the project';
          this._snackbar.open(errorMessage, 'close');
        });
      }
    }
  }

  private uploadPendingFiles(): void {
    
    if (this.projectDetails?.id) {
      const uploadPromises: Promise<any>[] = [];
      
      Object.entries(this.externalLinkFiles).forEach(([externalLinkId, file]) => {
        
        const formData = new FormData();
        formData.append('file', file);
                
        const uploadPromise = this.externalLinkService.uploadExternalLinkFile(this.projectDetails!.id!, externalLinkId, formData)
          .pipe(takeUntil(this.unsubscribe$))
          .toPromise()
          .then((response) => {
            console.log(`File uploaded for external link ${externalLinkId}:`, response);
            if (response.message) {
              this._snackbar.open(response.message, 'close');
            }
          })
          .catch((error) => {
            console.error(`Error uploading file for external link ${externalLinkId}:`, error);
            let errorMessage = 'File upload failed';
            
            if (error.error?.error) {
              errorMessage = error.error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this._snackbar.open(errorMessage, 'close', { duration: 5000 });
          });
          
        uploadPromises.push(uploadPromise);
      });
      
      // Wait for all uploads to complete before navigating
      Promise.allSettled(uploadPromises).then(() => {
        this.router.navigate([{outlets: {modal: null}}]);
      });
    } else {
      // No files to upload, navigate immediately
      this.router.navigate([{outlets: {modal: null}}]);
    }
  }

  // Helper methods for date formatting
  formatDateTime(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  hasExternalLinkContent(externalLink: AbstractControl): boolean {
    const url = externalLink.get('url')?.value;
    const linkType = externalLink.get('linkType')?.value;
    const originalFileName = externalLink.get('originalFileName')?.value;
    
    // Has content if there is an URL or file name
    return !!(url && url.trim()) || (linkType === 'INTERNAL' && originalFileName);
  }

  hasModificationDate(externalLink: AbstractControl): boolean {
    const modificationDate = externalLink.get('modificationDate')?.value;
    return !!modificationDate;
  }

  isModifiedAfterDeadline(externalLink: AbstractControl): boolean {
    const modificationDate = externalLink.get('modificationDate')?.value;
    const deadline = externalLink.get('deadline')?.value;
    
    if (!modificationDate || !deadline) return false;
    
    const modDate = new Date(modificationDate);
    const deadlineDate = new Date(deadline);
    
    return modDate > deadlineDate;
  }

  // History toggle methods
  toggleHistory(externalLinkId: string): void {
    if (this.expandedHistoryIds.has(externalLinkId)) {
      this.expandedHistoryIds.delete(externalLinkId);
    } else {
      this.expandedHistoryIds.add(externalLinkId);
    }
  }

  isHistoryExpanded(externalLinkId: string): boolean {
    return this.expandedHistoryIds.has(externalLinkId);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete()
  }
}
