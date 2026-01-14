import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentInfoService } from '../student-info.service';
import { StudentInfo, StudentSearchFilters } from '../models/student-info.model';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { jsPDF } from 'jspdf';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'student-search',
  templateUrl: './student-search.component.html',
  styleUrls: ['./student-search.component.scss']
})
export class StudentSearchComponent implements OnInit {
  students: StudentInfo[] = [];
  filteredStudents: StudentInfo[] = [];
  selectedStudent: StudentInfo | null = null;
  
  searchControl = new FormControl('');
  studyYearFilter = new FormControl('');
  hasProjectFilter = new FormControl<boolean | null>(null);

  displayedColumns: string[] = ['indexNumber', 'name', 'email', 'project', 'supervisor', 'defense', 'grades', 'status'];

  studyYears: string[] = [];

  // Modal properties
  showHelpModal = false;

  constructor(
    private studentInfoService: StudentInfoService,
    private router: Router,
    private route: ActivatedRoute,
    public app: AppComponent
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadStudyYears();

    // Check if we have a student index number in the route
    this.route.paramMap.subscribe(params => {
      const indexNumber = params.get('indexNumber');
      if (indexNumber) {
        // Load the specific student
        this.studentInfoService.getStudentById(indexNumber).subscribe(student => {
          if (student) {
            this.selectedStudent = student;
          }
        });
      }
    });

    // Search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });

    this.studyYearFilter.valueChanges.subscribe(() => this.applyFilters());
    this.hasProjectFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  loadStudents(): void {
    this.studentInfoService.searchStudents({}).subscribe(
      (students: StudentInfo[]) => {
        // Filter out invalid student objects
        const validStudents = students.filter(s => 
          s && typeof s === 'object' && s.name && s.indexNumber
        );
        this.students = validStudents;
        this.filteredStudents = validStudents;
      }
    );
  }

  loadStudyYears(): void {
    this.studentInfoService.getAllStudyYears().subscribe(
      (years: string[]) => {
        this.studyYears = years;
      }
    );
  }

  applyFilters(): void {
    const filters: StudentSearchFilters = {
      searchTerm: this.searchControl.value || '',
      studyYear: this.studyYearFilter.value || undefined,
      hasProject: this.hasProjectFilter.value ?? undefined
    };

    this.studentInfoService.searchStudents(filters).subscribe(
      (students: StudentInfo[]) => {
        this.filteredStudents = students;
      }
    );
  }

  selectStudent(student: StudentInfo): void {
    this.router.navigate(['/student-info', student.indexNumber]);
  }

  clearSelection(): void {
    this.selectedStudent = null;
    this.router.navigate(['/student-info']);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.studyYearFilter.setValue('');
    this.hasProjectFilter.setValue(null);
  }

  openHelpModal(): void {
    this.showHelpModal = true;
    document.body.classList.add('modal-open');
  }

  closeHelpModal(): void {
    this.showHelpModal = false;
    document.body.classList.remove('modal-open');
  }

  getFullName(student: StudentInfo): string {
    return student.name;
  }

  getProjectName(student: StudentInfo): string {
    if (student.confirmedProjectName) return student.confirmedProjectName;
    if (student.assignedProjectIds && student.assignedProjectIds.length > 0) {
      return `${this.app.translations['assigned_to_projects'] || 'Assigned to'} ${student.assignedProjectIds.length} ${this.app.translations['projects_count'] || 'project(s)'}`;
    }
    return this.app.translations['no_project'] || 'No project';
  }

  exportStudentAsPDF(): void {
    if (!this.selectedStudent) return;

    const pdf = new jsPDF();
    const student = this.selectedStudent;
    
    let yPosition = 20;
    const lineHeight = 8;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.width;
    const maxLineWidth = pageWidth - (margin * 2);

    // Helper function to add text
    const addText = (label: string, value: string, fontSize = 10, isBold = false) => {
      if (yPosition > pdf.internal.pageSize.height - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Label
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.text(label, margin, yPosition);
      
      // Value
      const labelWidth = pdf.getTextWidth(label);
      pdf.setFont('helvetica', 'normal');
      const valueLines = pdf.splitTextToSize(value, maxLineWidth - labelWidth - 5);
      pdf.text(valueLines, margin + labelWidth + 5, yPosition);
      
      yPosition += lineHeight * valueLines.length;
    };

    const addSection = (title: string) => {
      if (yPosition > pdf.internal.pageSize.height - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      yPosition += lineHeight;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yPosition);
      yPosition += lineHeight * 1.5;
    };

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.app.translations['student_information_report'] || 'Student Information Report', margin, yPosition);
    yPosition += lineHeight * 2;

    // Export date
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const exportDate = new Date().toLocaleString();
    pdf.text(`${this.app.translations['generated_on'] || 'Generated on'}: ${exportDate}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Personal Information
    addSection(this.app.translations['personal_information'] || 'Personal Information');
    addText(`${this.app.translations['full_name'] || 'Full Name'}: `, student.name || 'N/A');
    addText(`${this.app.translations['index_number'] || 'Index Number'}: `, student.indexNumber || 'N/A');
    addText(`${this.app.translations['email'] || 'Email'}: `, student.email || 'N/A');
    addText(`${this.app.translations['role'] || 'Role'}: `, student.role || 'N/A');
    addText(`${this.app.translations['current_study_year'] || 'Current Study Year'}: `, student.actualYear || 'N/A');
    
    if (student.studyYears && student.studyYears.length > 0) {
      addText(`${this.app.translations['all_study_years'] || 'All Study Years'}: `, student.studyYears.join(', '));
    }

    // Project Information
    addSection(this.app.translations['project_information'] || 'Project Information');
    
    if (student.confirmedProjectId) {
      addText(`${this.app.translations['confirmed_project'] || 'Confirmed Project'}: `, `${student.confirmedProjectName} (ID: ${student.confirmedProjectId})`);
    } else {
      addText(`${this.app.translations['confirmed_project'] || 'Confirmed Project'}: `, this.app.translations['none'] || 'None');
    }

    if (student.assignedProjectIds && student.assignedProjectIds.length > 0) {
      addText(`${this.app.translations['assigned_projects'] || 'Assigned Projects'}: `, `${student.assignedProjectIds.length} ${this.app.translations['projects'] || 'project(s)'}`);
      
      student.assignedProjectNames?.forEach((name, index) => {
        const projectId = student.assignedProjectIds![index];
        addText(`   ${index + 1}. `, `${name} (ID: ${projectId})`, 9);
      });
    }

    if (student.projectSupervisor) {
      addText(`${this.app.translations['supervisor'] || 'Supervisor'}: `, student.projectSupervisor);
    }

    if (student.defenseDate) {
      addText(`${this.app.translations['defense_date'] || 'Defense Date'}: `, student.defenseDate);
    }

    if (student.defenseTime) {
      addText(`${this.app.translations['defense_time'] || 'Defense Time'}: `, student.defenseTime);
    }

    // Grades
    addSection(this.app.translations['academic_performance'] || 'Academic Performance');
    
    addText(`${this.app.translations['first_semester_grade'] || 'First Semester Grade'}: `, student.firstSemesterGrade || 'N/A');
    addText(`${this.app.translations['second_semester_grade'] || 'Second Semester Grade'}: `, student.secondSemesterGrade || 'N/A');
    addText(`${this.app.translations['final_grade'] || 'Final Grade'}: `, student.finalGrade ? student.finalGrade.toString() : 'N/A');

    // Status
    addSection(this.app.translations['status'] || 'Status');
    addText(`${this.app.translations['project_accepted'] || 'Project Accepted'}: `, student.accepted ? (this.app.translations['yes'] || 'Yes') : (this.app.translations['no'] || 'No'));

    // Footer
    yPosition = pdf.internal.pageSize.height - 15;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(this.app.translations['auto_generated_report'] || 'This is an automatically generated report.', margin, yPosition);

    // Save the PDF
    const fileName = `student-${student.indexNumber}-${student.name.replace(/\s+/g, '-')}.pdf`;
    pdf.save(fileName);
  }
}
