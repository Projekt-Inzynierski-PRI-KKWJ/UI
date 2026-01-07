import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProjectMarketplaceDetailsComponent } from '../project-marketplace-details/project-marketplace-details.component';

interface Application {
  id: number;
  applicationDate: string;
  decisionDate?: string;
  status: string;
  projectId?: number;
  projectName?: string;
  projectDescription?: string;
  technologies?: string[];
  ownerDetails?: any;
}

@Component({
  selector: 'app-my-applications',
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit {
  applications: Application[] = [];
  filteredApplications: Application[] = [];
  isLoading: boolean = true;
  selectedTab: string = 'all';
  searchTerm: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.http.get<Application[]>('./pri/api/project-market/application/student')
      .subscribe({
        next: (applications) => {
          this.applications = applications;
          this.filterApplications();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load applications:', error);
          this.isLoading = false;
        }
      });
  }

  filterApplications(): void {
    let filtered = [...this.applications];

    // Filter by status tab
    if (this.selectedTab !== 'all') {
      const statusMap: { [key: string]: string } = {
        'pending': 'PENDING',
        'accepted': 'ACCEPTED',
        'rejected': 'REJECTED'
      };
      filtered = filtered.filter(app => app.status === statusMap[this.selectedTab]);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.projectName?.toLowerCase().includes(term) ||
        app.projectDescription?.toLowerCase().includes(term)
      );
    }

    this.filteredApplications = filtered;
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.filterApplications();
  }

  onSearchChange(): void {
    this.filterApplications();
  }

  getStatusCount(status: string): number {
    if (status === 'all') return this.applications.length;
    const statusMap: { [key: string]: string } = {
      'pending': 'PENDING',
      'accepted': 'ACCEPTED',
      'rejected': 'REJECTED'
    };
    return this.applications.filter(app => app.status === statusMap[status]).length;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'ACCEPTED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#FFA726';
      case 'ACCEPTED': return '#66BB6A';
      case 'REJECTED': return '#EF5350';
      default: return '#BDBDBD';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewProjectDetails(projectId: number): void {
    if (!projectId) return;
    
    this.dialog.open(ProjectMarketplaceDetailsComponent, {
      width: '900px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { projectId: projectId },
      panelClass: 'centered-custom-modal',
      autoFocus: false,
      restoreFocus: false
    });
  }

  withdrawApplication(applicationId: number): void {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    // TODO: Implement withdraw endpoint when available
    console.log('Withdraw application:', applicationId);
  }

  goToMarketplace(): void {
    this.router.navigate(['/marketplace']);
  }

  goBack(): void {
    this.router.navigate(['/marketplace']);
  }
}
