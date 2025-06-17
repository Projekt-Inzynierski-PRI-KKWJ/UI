import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, retry, catchError } from 'rxjs';
import { CriteriaProjectDTO } from '../models/project-criterion.model';

@Injectable({ providedIn: 'root' })
export class ProjectCriteriaService {
  private baseUrl = '/pri/api/criteria-projects';

  constructor(private http: HttpClient) {}

  /**
   * Send multiple criteria at once.
   * Accepts an array of CriteriaProjectDTO.
   */
  addCriteria(criteriaList: CriteriaProjectDTO[]): Observable<any> {
    return this.http.post(this.baseUrl, criteriaList,{ withCredentials: true }).pipe(
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
    return this.http.get(this.baseUrl,{ withCredentials: true }).pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching criteria list:', error);
        return throwError(() => error);
      })
    );
  }

  getCriteriaByProjectId(projectId: number): Observable<CriteriaProjectDTO[]> {
    return this.http.get<CriteriaProjectDTO[]>(`${this.baseUrl}/project/${projectId}`, { withCredentials: true });
  }

  updateLevel(id: number, levelOfRealization: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/level`, { levelOfRealization },{ withCredentials: true });
  }

  updateComment(id: number, comment: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/comment`, { comment },{ withCredentials: true });
  }

  updateCommentAndLevel(id: number, data: { comment: string, levelOfRealization: string }): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/comment-level`, data,{ withCredentials: true });
  }

  updateEnableForModification(id: number, enable: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/enable`, { enable },{ withCredentials: true });
  }

  updateType(id: number, type: 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS'): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/type`, { type }, { withCredentials: true });
  }


}
