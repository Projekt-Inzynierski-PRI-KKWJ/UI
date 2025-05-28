import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, retry, catchError } from 'rxjs';
import { CriteriaProjectDTO } from '../models/project-criterion.model';

@Injectable({ providedIn: 'root' })
export class ProjectCriteriaService {
  private baseUrl = 'http://localhost:8080/api/criteria-projects';

  constructor(private http: HttpClient) {}

  /**
   * Send multiple criteria at once.
   * Accepts an array of CriteriaProjectDTO.
   */
  addCriteria(criteriaList: CriteriaProjectDTO[]): Observable<any> {
    return this.http.post(this.baseUrl, criteriaList).pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => {
        console.error('Error occurred while posting criteria:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Optionally, fetch all criteria (per documentation).
   */
  getAllCriteria(): Observable<any> {
    return this.http.get(this.baseUrl).pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching criteria list:', error);
        return throwError(() => error);
      })
    );
  }
}
