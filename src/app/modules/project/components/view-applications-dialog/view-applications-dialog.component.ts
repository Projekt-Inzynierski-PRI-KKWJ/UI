import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Applicant {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  indexNumber?: string;
  contactData: string;
  skills: string;
  otherInformation?: string;
  applicationDate: string;
  status: string;
}

@Component({
  selector: 'app-view-applications-dialog',
  templateUrl: './view-applications-dialog.component.html',
  styleUrls: ['./view-applications-dialog.component.scss']
})
export class ViewApplicationsDialogComponent implements OnInit {
  applications: Applicant[] = [];
  isLoading: boolean = true;
  processingApplicationId: number | null = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ViewApplicationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number, projectName: string }
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.http.get<Applicant[]>(`./pri/api/project-market/application/${this.data.projectId}`)
      .subscribe({
        next: (applications) => {
          console.log('Backend applications response:', applications);
          console.log('First application:', applications[0]);
          this.applications = applications;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load applications:', error);
          this.snackBar.open('Failed to load applications', 'OK', { duration: 3000,
              panelClass: ['error-snackbar'] });
          this.isLoading = false;
        }
      });
  }

  approveApplication(applicationId: number): void {
    if (!confirm('Are you sure you want to approve this application?')) {
      return;
    }

    this.processingApplicationId = applicationId;
    this.http.patch(`./pri/api/project-market/application/${applicationId}/approve`, {})
      .subscribe({
        next: () => {
          this.snackBar.open('Application approved successfully!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
          this.processingApplicationId = null;
          this.loadApplications();
          this.dialogRef.close('updated');
        },
        error: (error) => {
          console.error('Failed to approve application:', error);
          this.snackBar.open('Failed to approve application', 'OK', { duration: 3000, panelClass: ['error-snackbar'] });
          this.processingApplicationId = null;
        }
      });
  }

  rejectApplication(applicationId: number): void {
    if (!confirm('Are you sure you want to reject this application?')) {
      return;
    }

    this.processingApplicationId = applicationId;
    this.http.patch(`./pri/api/project-market/application/${applicationId}/reject`, {})
      .subscribe({
        next: () => {
          this.snackBar.open('Application rejected', 'OK', { duration: 3000,
              panelClass: ['success-snackbar'] });
          this.processingApplicationId = null;
          this.loadApplications();
        },
        error: (error) => {
          console.error('Failed to reject application:', error);
          this.snackBar.open('Failed to reject application', 'OK', { duration: 3000, panelClass: ['error-snackbar'] });
          this.processingApplicationId = null;
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
