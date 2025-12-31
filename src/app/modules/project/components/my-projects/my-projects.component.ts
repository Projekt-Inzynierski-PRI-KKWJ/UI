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
    return project.ownerDetails.name || 'Unknown';
  }
}
