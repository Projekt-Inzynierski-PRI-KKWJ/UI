import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, retry, throwError, catchError } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class DataFeedService {
    constructor(private http: HttpClient) { }



    resetDataBase():Observable<string>
    {
        return this.http.delete<string>(`./pri/data/reset`).pipe(
                retry(0),//there can be no retrys 
                    catchError((err: HttpErrorResponse) => {
      console.error("Database reset failed", err);
      return throwError(() => new Error("Failed to reset database."));
    })
  );

    }



    uploadStudents(data: FormData): Observable<null>  {
        return this.http
            .post<null>(`./pri/data/import/student`, data)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }

    public setHttpHeadersForFile(): any {
        const httpHeaders = new HttpHeaders().set(
            'Content-Type',
            'application/json; charset-utf-8'
        );
        return {
            headers: httpHeaders,
            responseType: 'blob',
            observe: 'response'
        }
        
    }



    uploadSupervisors(data: FormData): Observable<null>  {
        return this.http
            .post<null>(`./pri/data/import/supervisor`, data)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    uploadCriteria(data: FormData): Observable<null>  {
        return this.http
            .post<null>(`./pri/data/import/criteria`, data)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }

    
    exportStudents(): Observable<any> {
        return this.http
            .get<HttpResponse<Blob>>(`./pri/data/export/student`, this.setHttpHeadersForFile())
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    exportCriteria(): Observable<any> {
        return this.http
            .get<HttpResponse<Blob>>(`./pri/data/export/criteria`, this.setHttpHeadersForFile())
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    exportGrades(): Observable<any> {
        return this.http
            .get<HttpResponse<Blob>>(`./pri/data/export/grades`, this.setHttpHeadersForFile())
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }




    getAvailableStudyYearsForExport(): Observable<string[]> {
        return this.http
            .get<string[]>(`./pri/export/study-year`)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }




    exportStudyYearData(studyYear: string): Observable<any> {
        return this.http
            .get<HttpResponse<Blob>>(`./pri/export/study-year/${studyYear}`, this.setHttpHeadersForFile())
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }




}