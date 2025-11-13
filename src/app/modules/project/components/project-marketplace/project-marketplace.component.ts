import { Component, OnInit } from '@angular/core';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-project-marketplace',
  templateUrl: './project-marketplace.component.html',
  styleUrls: ['./project-marketplace.component.scss']
})
export class ProjectMarketplaceComponent implements OnInit {
  searchTerm: string = '';
  projects: Project[] = [];
  filteredProjects: Project[] = [];

  ngOnInit() {
    this.projects = [
      { id: 'P001', name: 'System rezerwacji sal', supervisor: { name: 'Dr Kowalski' } as any, accepted: true },
      { id: 'P002', name: 'Analiza danych pogodowych', supervisor: { name: 'Mgr Nowak' } as any, accepted: false }
    ];

    this.filteredProjects = [...this.projects];
  }

  searchProjects() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(p =>
      p.name.toLowerCase().includes(term)
    );
  }

  openAddProjectDialog() {
    console.log('Nowy projekt');
  }

  openMyApplications() {
    console.log('Moje wnioski');
  }

  openMyProject() {
    console.log('Mój projekt');
  }
}
