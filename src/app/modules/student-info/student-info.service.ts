import { Injectable } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { StudentInfo } from './models/student-info.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentInfoService {

  constructor(private http: HttpClient) { }

  searchStudents(filters: any): Observable<StudentInfo[]> {
    return this.http
      .get<StudentInfo[]>('./pri/user/student/detailed')
      .pipe(
        map(students => {
          let filtered = students;

          if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(student => 
              student.name.toLowerCase().includes(term) ||
              student.indexNumber.includes(term) ||
              student.email.toLowerCase().includes(term)
            );
          }

          if (filters.studyYear) {
            filtered = filtered.filter(student => 
              (student.studyYears && student.studyYears.includes(filters.studyYear)) || 
              student.actualYear === filters.studyYear
            );
          }

          if (filters.hasProject !== undefined && filters.hasProject !== null) {
            filtered = filtered.filter(student => 
              filters.hasProject 
                ? (student.confirmedProjectId !== undefined && student.confirmedProjectId !== null) 
                : (student.confirmedProjectId === undefined || student.confirmedProjectId === null)
            );
          }

          return filtered;
        }),
        retry(3),
        catchError((err: HttpErrorResponse) => throwError(() => err))
      );
  }

  getStudentById(indexNumber: string): Observable<StudentInfo | undefined> {
    return this.searchStudents({}).pipe(
      map(students => students.find(s => s.indexNumber === indexNumber))
    );
  }

  getAllStudyYears(): Observable<string[]> {
    return this.searchStudents({}).pipe(
      map(students => {
        const years = new Set<string>();
        students.forEach(student => {
          if (student.studyYears) {
            student.studyYears.forEach((year: string) => years.add(year));
          }
          if (student.actualYear) years.add(student.actualYear);
        });
        return Array.from(years).sort();
      })
    );
  }
}
