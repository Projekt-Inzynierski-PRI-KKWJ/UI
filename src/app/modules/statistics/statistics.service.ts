import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, retry, throwError, catchError } from 'rxjs';
import { Project } from '../project/models/project.model';


@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  constructor(private http: HttpClient) {}

  getProjects(studyYear: string): Observable<Project[]> {
    return this.http
      .get<Project[]>(`./pri/project`, {
        headers: { 'study-year': studyYear },
        withCredentials: true
      })
      .pipe(
        retry(3),
        catchError((err: HttpErrorResponse) => {
          console.error('Error when fetching the project:', err);
          return throwError(() => err);
        })
      );
      
  }

getProjectCriteria(projectId: number): Observable<any[]> {
  return this.http
    .get<any[]>(`/pri/api/criteria-projects/project/${projectId}`, {
      withCredentials: true
    })
    .pipe(
      retry(2),
      catchError((err: HttpErrorResponse) => {
        console.error('Error when fetching criteria:', err);
        return throwError(() => err);
      })
    );
}


}




