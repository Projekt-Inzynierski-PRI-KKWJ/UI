export interface StudentInfo {
  indexNumber: string;
  name: string;
  email: string;
  role: string;
  accepted: boolean;
  // Project information from backend
  confirmedProjectId?: number;
  confirmedProjectName?: string;
  assignedProjectIds?: number[];
  assignedProjectNames?: string[];
  // Grade information from backend (confirmed project's evaluation cards)
  firstSemesterGrade?: string;   // e.g., "75.50%"
  secondSemesterGrade?: string;  // e.g., "82.30%"
  finalGrade?: number;           // e.g., 4.5 (scale: 2.0-5.0)
  isApprovedForDefense?: boolean;
  // Fields to be populated from other endpoints later
  studyYears?: string[];
  actualYear?: string;
  projectSupervisor?: string;
  defenseDate?: string;
  defenseTime?: string;
}

export interface StudentSearchFilters {
  searchTerm: string;
  studyYear?: string;
  hasProject?: boolean;
  isApprovedForDefense?: boolean;
}
