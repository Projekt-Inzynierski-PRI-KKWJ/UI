import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, retry, throwError, catchError } from "rxjs";
import { ExternalLink } from "../models/external-link.model";

@Injectable({
    providedIn: 'root'
})
export class ExternalLinkService {
    constructor(private http: HttpClient) {}

    columnHeaders$: Observable<string[]> = this.http
        .get<string[]>(`./pri/project/external-link/column-header`)
        .pipe(
            retry(3),
            catchError(
                (err: HttpErrorResponse) => throwError(() => err))
        )

    getExternalLinks(projectId: string): Observable<ExternalLink[]> {
        return this.http
        .get<ExternalLink[]>(`./pri/project/${projectId}/external-link`)
        .pipe(
            retry(3),
            catchError(
                (err: HttpErrorResponse) => throwError(() => err))
        )
    }

    // File upload for external links
    uploadExternalLinkFile(projectId: string, externalLinkId: string, file: FormData): Observable<any> {
        
        return this.http
            .post<any>(`./pri/project/${projectId}/external-link/${externalLinkId}/upload`, file)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => {
                        console.error('UPLOAD ERROR DETAILS');
                        console.error('Status:', err.status);
                        console.error('Status Text:', err.statusText);
                        console.error('Error:', err.error);
                        console.error('Message:', err.message);
                        console.error('URL:', err.url);
                        console.error('Headers:', err.headers);
                        return throwError(() => err);
                    })
            )
    }

    // File download for external links
    getExternalLinkFileDownloadUrl(projectId: string, externalLinkId: string): string {
        return `./pri/project/${projectId}/external-link/${externalLinkId}/download`;
    }

    // Delete file for external links
    deleteExternalLinkFile(projectId: string, externalLinkId: string): Observable<any> {
        return this.http
            .delete<any>(`./pri/project/${projectId}/external-link/${externalLinkId}/file`)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }
}