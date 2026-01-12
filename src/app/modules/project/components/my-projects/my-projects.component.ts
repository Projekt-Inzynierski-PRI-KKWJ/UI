import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ProjectMarketplaceDetailsComponent } from '../project-marketplace-details/project-marketplace-details.component';

interface MyProject {
  id: number;
  projectName: string;
  projectDescription?: string;
  ownerDetails?: any;
  availableSlots?: string;
  studyYear?: string;
  status?: string;
}

@Component({
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.scss']
})
export class MyProjectsComponent implements OnInit {
  projects: MyProject[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMyProjects();
  }

  loadMyProjects(): void {
    this.isLoading = true;
    this.http.get<any>('./pri/api/project-market/market/my-projects?page=0&size=100')
      .subscribe({
        next: (response) => {
          this.projects = response.content || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load projects:', error);
          this.isLoading = false;
        }
      });
  }

  get filteredProjects(): MyProject[] {
    if (!this.searchTerm) {
      return this.projects;
    }
    const term = this.searchTerm.toLowerCase();
    return this.projects.filter(project =>
      project.projectName?.toLowerCase().includes(term) ||
      project.projectDescription?.toLowerCase().includes(term)
    );
  }

  goBack(): void {
    this.router.navigate(['/marketplace']);
  }

  goToMarketplace(): void {
    this.router.navigate(['/marketplace']);
  }

  viewProjectDetails(projectId: number): void {
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
        this.loadMyProjects();
      }
    });
  }

  getOwnerName(project: MyProject): string {
    if (!project.ownerDetails) return 'Unknown';
    const firstName = project.ownerDetails.firstName || '';
    const lastName = project.ownerDetails.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Unknown';
  }

  getStatusLabel(status?: string): string {
    if (!status) return 'Active';
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'SENT_FOR_APPROVAL_TO_SUPERVISOR':
        return 'Pending Approval';
      case 'APPROVED_BY_SUPERVISOR':
        return 'Approved';
      case 'REJECTED_BY_SUPERVISOR':
        return 'Rejected';
      case 'CLOSED_BY_OWNER':
        return 'Closed';
      default:
        return status;
    }
  }

  getStatusColor(status?: string): string {
    if (!status) return '#4CAF50';
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50'; // green
      case 'SENT_FOR_APPROVAL_TO_SUPERVISOR':
        return '#FF9800'; // orange
      case 'APPROVED_BY_SUPERVISOR':
        return '#2196F3'; // blue
      case 'REJECTED_BY_SUPERVISOR':
        return '#F44336'; // red
      case 'CLOSED_BY_OWNER':
        return '#9E9E9E'; // grey
      default:
        return '#4CAF50';
    }
  }
}
