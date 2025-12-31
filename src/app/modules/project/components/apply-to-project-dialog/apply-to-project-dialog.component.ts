import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-apply-to-project-dialog',
  templateUrl: './apply-to-project-dialog.component.html',
  styleUrls: ['./apply-to-project-dialog.component.scss']
})
export class ApplyToProjectDialogComponent implements OnInit {
  applicationForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ApplyToProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number, projectName: string }
  ) {
    this.applicationForm = this.fb.group({
      contactData: ['', [Validators.required, Validators.email]],
      skills: ['', [Validators.required, Validators.minLength(10)]],
      otherInformation: ['']
    });
  }

  ngOnInit(): void {}

  submitApplication(): void {
    if (this.applicationForm.invalid) {
      Object.keys(this.applicationForm.controls).forEach(key => {
        this.applicationForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.applicationForm.value;

    this.http.post(`./pri/api/project-market/application/${this.data.projectId}/apply`, formValue)
      .subscribe({
        next: () => {
          this.snackBar.open('Application submitted successfully!', 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close('applied');
        },
        error: (error) => {
          console.error('Failed to submit application:', error);
          const errorMessage = error.error?.errorMessage || error.message || 'Failed to submit application';
          this.snackBar.open(`Error: ${errorMessage}`, 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
