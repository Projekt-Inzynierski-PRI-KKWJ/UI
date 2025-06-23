import { Component, OnDestroy } from '@angular/core';
import { DataFeedService } from './data-feed.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { saveAs } from 'file-saver';
import { HttpResponse } from '@angular/common/http';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-data-feed',
  templateUrl: './data-feed.component.html',
  styleUrls: ['./data-feed.component.scss']
})
export class DataFeedComponent implements OnDestroy {
  supervisorsFileName = '';
  supervisorsFile!: FormData;
  studentsFileName = '';
  studentsFile!: FormData;
  criteriaFileName = '';
  criteriaFile!: FormData;
  unsubscribe$ = new Subject();
  
  availableStudyYears: string[] = [];
  displayedColumns: string[] = ['studyYear', 'actions'];

  constructor(private _snackBar: MatSnackBar, private dataFeedService: DataFeedService) {
    this.loadAvailableStudyYears();
  }

  uploadFile(event: any, expectedExtension: string, target: 'students' | 'supervisors' | 'criteria') {
    const file: File = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== expectedExtension) {
      this._snackBar.open(`Only .${expectedExtension} files are allowed for ${target}.`, 'close', { duration: 4000 });
      return;
    }

    const formData = new FormData();
    formData.append("data", file);

    switch (target) {
      case 'students':
        this.studentsFileName = file.name;
        this.studentsFile = formData;
        break;
      case 'supervisors':
        this.supervisorsFileName = file.name;
        this.supervisorsFile = formData;
        break;
      case 'criteria':
        this.criteriaFileName = file.name;
        this.criteriaFile = formData;
        break;
    }
  }

  uploadStudents(event: any) {
    this.uploadFile(event, 'csv', 'students');
  }


  uploadSupervisors(event: any) {
    this.uploadFile(event, 'csv', 'supervisors');
  }

  uploadCriteria(event: any) {
    this.uploadFile(event, 'json', 'criteria');
  }

  uploadFiles() {
    if (!this.studentsFile && !this.supervisorsFile && !this.criteriaFile) {
      this._snackBar.open('No files selected for upload.', 'close', { duration: 4000 });
      return;
    }

    if (this.studentsFile) {
      this.dataFeedService.uploadStudents(this.studentsFile).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: () => {
          this.studentsFileName = '';
          this.studentsFile = new FormData();
          this._snackBar.open('Students successfully uploaded', 'close');
        },
        error: (error) => this.handleUploadError(error)
      });
    }

    if (this.supervisorsFile) {
      this.dataFeedService.uploadSupervisors(this.supervisorsFile).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: () => {
          this.supervisorsFileName = '';
          this.supervisorsFile = new FormData();
          this._snackBar.open('Supervisors successfully uploaded', 'close');
        },
        error: (error) => this.handleUploadError(error)
      });
    }

    if (this.criteriaFile) {
      this.dataFeedService.uploadCriteria(this.criteriaFile).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: () => {
          this.criteriaFileName = '';
          this.criteriaFile = new FormData();
          this._snackBar.open('Criteria successfully uploaded', 'close');
        },
        error: (error) => this.handleUploadError(error)
      });
    }
  }

  exportStudents() {
    this.dataFeedService.exportStudents().pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (file: HttpResponse<Blob>) => {
        if (file?.body) {
          saveAs(file.body!, 'students.csv');
        }
      },
      error: (error) => this.handleExportError(error, 'students.csv')
    });
  }

  exportCriteria() {
    this.dataFeedService.exportCriteria().pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (file: HttpResponse<Blob>) => {
        if (file?.body) {
          saveAs(file.body!, 'criteria.json');
        }
      },
      error: (error) => this.handleExportError(error, 'criteria.json')
    });
  }

  exportGrades() {
    this.dataFeedService.exportGrades().pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (file: HttpResponse<Blob>) => {
        if (file?.body) {
          saveAs(file.body!, 'grades.csv');
        }
      },
      error: (error) => this.handleExportError(error, 'grades.csv')
    });
  }

  private handleUploadError(error: any) {
    if (error.status === 413) {
      this._snackBar.open('File is too large. Maximum allowed size exceeded.', 'close', { duration: 5000 });
    } else if (error.status === 0 && error instanceof ProgressEvent) {
      this._snackBar.open('Upload failed. Possibly due to file size too large (NGINX limit).', 'close', { duration: 5000 });
    } else {
      const errorMessage = error.error?.errorMessage || 'Unknown error occurred';
      this._snackBar.open('Error: ' + errorMessage, 'close', { duration: 5000 });
    }
  }

  private loadAvailableStudyYears() {
    this.dataFeedService.getAvailableStudyYearsForExport().pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (years: string[]) => {
        this.availableStudyYears = years;
      },
      error: (error) => {
        console.error('Failed to load available study years:', error);
        this._snackBar.open('Failed to load available study years', 'close', { duration: 3000 });
      }
    });
  }

  private handleExportError(error: any, fileName: string) {
    if (error.status === 404) {
      this._snackBar.open(`Export failed: file ${fileName} not found.`, 'close', { duration: 5000 });
    } else if (error.status === 500) {
      this._snackBar.open(`Export failed due to server error.`, 'close', { duration: 5000 });
    } else {
      this._snackBar.open('Unexpected error during export.', 'close', { duration: 5000 });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  exportStudyYearData(studyYear: string) {
    this.dataFeedService.exportStudyYearData(studyYear).pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (response: HttpResponse<Blob>) => {
        if (response?.body) {
          const readableStudyYear = studyYear.replace('-', '#');
          const fileName = `study-year-export-${readableStudyYear}.json`;
          saveAs(response.body, fileName);
          this._snackBar.open(`Study year ${readableStudyYear} data exported successfully`, 'close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Failed to export study year data:', error);
        this._snackBar.open('Failed to export study year data', 'close', { duration: 3000 });
      }
    });
  }

  exportStudyYearDataAsPdf(studyYear: string) {
    this.dataFeedService.exportStudyYearData(studyYear).pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (response: HttpResponse<Blob>) => {
        if (response?.body) {
          this.convertJsonToPdf(response.body, studyYear);
        }
      },
      error: (error) => {
        console.error('Failed to export study year data as PDF:', error);
        this._snackBar.open('Failed to export study year data as PDF', 'close', { duration: 3000 });
      }
    });
  }

  private async convertJsonToPdf(blob: Blob, studyYear: string) {
    try {
      const jsonText = await blob.text();
      const data = JSON.parse(jsonText);
      const readableStudyYear = studyYear.replace('-', '#');

      const pdf = new jsPDF();
      let yPosition = 20;
      const lineHeight = 8;
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.width;
      const maxLineWidth = pageWidth - (margin * 2);

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Study Year Export: ${readableStudyYear}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Helper function to add text and handle page breaks
      const addText = (text: string, fontSize = 10, fontStyle: 'normal' | 'bold' = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        
        const lines = pdf.splitTextToSize(text, maxLineWidth);
        for (const line of lines) {
          if (yPosition > pdf.internal.pageSize.height - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight * 0.5;
      };

      const addProjectTable = (projects: any[]) => {
        if (!projects || projects.length === 0) return;

        addText('PROJECTS OVERVIEW', 14, 'bold');
        yPosition += 5;

        projects.forEach((project, projectIndex) => {
          // Check if we need a new page
          if (yPosition > pdf.internal.pageSize.height - 120) {
            pdf.addPage();
            yPosition = 20;
          }

          // Project header - use name or title, fallback to ID
          const projectTitle = project.name || project.title || project.projectName || `Project ${project.id || projectIndex + 1}`;
          addText(`${projectIndex + 1}. ${projectTitle}`, 12, 'bold');
          
          // Project details - show all available information
          if (project.description) {
            addText(`Description: ${project.description}`, 9);
          }
          if (project.topic) {
            addText(`Topic: ${project.topic}`, 9);
          }
          if (project.supervisor) {
            const supervisorName = project.supervisor.firstName && project.supervisor.lastName 
              ? `${project.supervisor.firstName} ${project.supervisor.lastName}`
              : project.supervisor.email || project.supervisor.name || 'Unknown Supervisor';
            addText(`Supervisor: ${supervisorName}`, 9);
          }
          if (project.capacity !== undefined) {
            addText(`Capacity: ${project.capacity}`, 9);
          }
          if (project.maxCapacity !== undefined) {
            addText(`Max Capacity: ${project.maxCapacity}`, 9);
          }
          if (project.status) {
            addText(`Status: ${project.status}`, 9);
          }
          if (project.type) {
            addText(`Type: ${project.type}`, 9);
          }
          if (project.studyYear) {
            addText(`Study Year: ${project.studyYear}`, 9);
          }
          if (project.createdAt) {
            addText(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, 9);
          }
          
          yPosition += 5;

          // Students table for this project
          if (project.students && project.students.length > 0) {
            addText('Students Assigned:', 10, 'bold');
            yPosition += 3;
            
            // Simple table for students
            const studentHeaders = ['Name', 'Email', 'Index Number', 'Status'];
            const cellWidth = (maxLineWidth - 20) / studentHeaders.length;
            
            // Headers
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            studentHeaders.forEach((header, i) => {
              const x = margin + 10 + (i * cellWidth);
              pdf.text(header, x, yPosition);
            });
            yPosition += 12;
            
            // Student rows
            pdf.setFont('helvetica', 'normal');
            project.students.forEach((student: any) => {
              if (yPosition > pdf.internal.pageSize.height - 30) {
                pdf.addPage();
                yPosition = 20;
              }
              
              const studentName = student.firstName && student.lastName 
                ? `${student.firstName} ${student.lastName}`
                : student.name || 'Unknown';
              const studentEmail = student.email || '';
              const indexNumber = student.indexNumber || student.studentNumber || '';
              const status = student.status || student.enrollmentStatus || '';
              
              const studentData = [studentName, studentEmail, indexNumber, status];
              
              studentData.forEach((cell, i) => {
                const x = margin + 10 + (i * cellWidth);
                const cellText = pdf.splitTextToSize(cell, cellWidth - 4);
                pdf.text(cellText[0] || '', x, yPosition);
              });
              yPosition += 10;
            });
            yPosition += 8;
          } else {
            addText('Students: No students assigned', 9);
            yPosition += 3;
          }

          // External links for this project - with detailed information
          if (project.externalLinks && project.externalLinks.length > 0) {
            addText('External Links & Files:', 10, 'bold');
            yPosition += 5;
            
            // Table headers
            const linkHeaders = ['Name', 'Category', 'Type', 'URL/File', 'Size'];
            const cellWidth = (maxLineWidth - 20) / linkHeaders.length;
            
            // Check if we need a new page for the table
            if (yPosition > pdf.internal.pageSize.height - 60) {
              pdf.addPage();
              yPosition = 20;
            }
            
            // Draw table headers
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            linkHeaders.forEach((header, i) => {
              const x = margin + 10 + (i * cellWidth);
              pdf.text(header, x, yPosition);
            });
            yPosition += 12;
            
            // Draw table rows
            pdf.setFont('helvetica', 'normal');
            project.externalLinks.forEach((link: any) => {
              if (yPosition > pdf.internal.pageSize.height - 30) {
                pdf.addPage();
                yPosition = 20;
                
                // Redraw headers on new page
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                linkHeaders.forEach((header, i) => {
                  const x = margin + 10 + (i * cellWidth);
                  pdf.text(header, x, yPosition);
                });
                yPosition += 12;
                pdf.setFont('helvetica', 'normal');
              }
              
              const linkName = link.name || link.originalFileName || 'Document';
              const category = link.columnHeader || '';
              const linkType = link.linkType || '';
              const urlOrFile = link.url || link.originalFileName || '';
              const fileSize = link.fileSize ? `${Math.round(link.fileSize / 1024)} KB` : '';
              
              const rowData = [linkName, category, linkType, urlOrFile, fileSize];
              
              rowData.forEach((cell, i) => {
                const x = margin + 10 + (i * cellWidth);
                const cellText = pdf.splitTextToSize(cell, cellWidth - 4);
                pdf.text(cellText[0] || '', x, yPosition);
              });
              yPosition += 10;
            });
            
            yPosition += 8;
          }

          // Grades/evaluations if available
          if (project.grades && project.grades.length > 0) {
            addText('Grades/Evaluations:', 10, 'bold');
            project.grades.forEach((grade: any) => {
              const gradeText = `${grade.criteriaName || 'Grade'}: ${grade.value || grade.score || 'N/A'}`;
              if (grade.studentName) {
                addText(`   ${grade.studentName}: ${gradeText}`, 8);
              } else {
                addText(`   ${gradeText}`, 8);
              }
            });
            yPosition += 5;
          }

          // Add spacing between projects
          yPosition += 15;
        });
      };

      const addSupervisorsTable = (supervisors: any[]) => {
        if (!supervisors || supervisors.length === 0) return;

        if (yPosition > pdf.internal.pageSize.height - 100) {
          pdf.addPage();
          yPosition = 20;
        }

        addText('SUPERVISORS OVERVIEW', 14, 'bold');
        yPosition += 10;

        supervisors.forEach((supervisor, index) => {
          if (yPosition > pdf.internal.pageSize.height - 80) {
            pdf.addPage();
            yPosition = 20;
          }

          // Supervisor header
          const name = supervisor.firstName && supervisor.lastName 
            ? `${supervisor.firstName} ${supervisor.lastName}`
            : supervisor.name || supervisor.email || 'Unknown Supervisor';
          
          addText(`${index + 1}. ${name}`, 12, 'bold');
          
          // Supervisor details
          if (supervisor.email) {
            addText(`Email: ${supervisor.email}`, 9);
          }
          if (supervisor.department) {
            addText(`Department: ${supervisor.department}`, 9);
          }
          if (supervisor.title || supervisor.academicTitle) {
            addText(`Title: ${supervisor.title || supervisor.academicTitle}`, 9);
          }
          if (supervisor.maxNumberOfProjects !== undefined) {
            addText(`Max Projects: ${supervisor.maxNumberOfProjects}`, 9);
          }
          if (supervisor.projects) {
            addText(`Current Projects: ${supervisor.projects.length}`, 9);
            
            // List project titles
            if (supervisor.projects.length > 0) {
              addText('Supervising Projects:', 10, 'bold');
              supervisor.projects.forEach((project: any, projIndex: number) => {
                const projectTitle = project.name || project.title || project.projectName || `Project ${projIndex + 1}`;
                addText(`   • ${projectTitle}`, 8);
              });
            }
          }
          
          yPosition += 15;
        });
      };

      // Main document structure
      if (data.studyYear) {
        addText(`STUDY YEAR DATA EXPORT: ${data.studyYear}`, 16, 'bold');
        yPosition += 10;
      }

      // Generate timestamp
      const now = new Date();
      addText(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 8);
      yPosition += 15;

      // Projects with their students and links
      if (data.projects) {
        addProjectTable(data.projects);
      }

      // Supervisors overview
      if (data.supervisors) {
        addSupervisorsTable(data.supervisors);
      }

      // Summary statistics
      if (yPosition > pdf.internal.pageSize.height - 80) {
        pdf.addPage();
        yPosition = 20;
      }
      
      addText('SUMMARY STATISTICS', 14, 'bold');
      yPosition += 5;
      
      if (data.projects) addText(`Total Projects: ${data.projects.length}`, 10);
      if (data.students) addText(`Total Students: ${data.students.length}`, 10);
      if (data.supervisors) addText(`Total Supervisors: ${data.supervisors.length}`, 10);
      if (data.externalLinks) addText(`Total External Links: ${data.externalLinks.length}`, 10);

      // Save the PDF
      const fileName = `study-year-export-${readableStudyYear}.pdf`;
      pdf.save(fileName);
      
      this._snackBar.open(`Study year ${readableStudyYear} PDF exported successfully`, 'close', { duration: 3000 });
    } catch (error) {
      console.error('Error converting JSON to PDF:', error);
      this._snackBar.open('Failed to convert data to PDF', 'close', { duration: 3000 });
    }
  }
}