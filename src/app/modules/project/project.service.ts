import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, retry, throwError, catchError } from "rxjs";
import { Supervisor } from "../user/models/supervisor.model";
import { SupervisorAvailability } from "./models/supervisor-availability.model";
import { Student } from "../user/models/student.model";
import { ExternalLink } from "./models/external-link.model";
import { Project, ProjectDetails } from "./models/project.model";


@Injectable({
    providedIn: 'root',

})

export class ProjectService 
{
    constructor(private http: HttpClient) { }


    
    getProjectDetails(id: string): Observable<ProjectDetails> {
        return this.http
            .get<ProjectDetails>(`./pri/project/${id}`)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }




    removeProject(id: string): Observable<null> {
        return this.http
            .delete<null>(`./pri/project/${id}`)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }
    



    addProject(project: ProjectDetails): Observable<ProjectDetails> {
        return this.http
            .post<ProjectDetails>(`./pri/project`, project)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    updateProject(project: ProjectDetails): Observable<ProjectDetails>  {
        return this.http
            .put<ProjectDetails>(`./pri/project/${project.id}`, project)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    updateSupervisorAvailability(supervisorAvailability: SupervisorAvailability[]): Observable<SupervisorAvailability[]> {
        return this.http
            .put<SupervisorAvailability[]>('./pri/project/supervisor/availability', supervisorAvailability)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    acceptProject(projectId: string): Observable<null> 
    {

        return this.http
            .patch<null>(`./pri/project/${projectId}/accept`, null)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    unacceptProject(projectId: string): Observable<null> 
    {

        return this.http
            .patch<null>(`./pri/project/${projectId}/unaccept`, null)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )

    }




    getExternalLinks(projectId: string): Observable<ExternalLink[]> {
        return this.http
        .get<ExternalLink[]>(`./pri/project/${projectId}/external-link`)
        .pipe(
            retry(3),
            catchError(
                (err: HttpErrorResponse) => throwError(() => err))
        )
    }




    publishAllProjects(): Observable<null> {
        return this.http
            .put<null>(`./pri/project/evaluation-card/publish`, null)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }



    activateSecondSemester(): Observable<null> {
        return this.http
            .put<null>(`./pri/project/evaluation-card/activate-second-semester`, null)
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )
    }

 isSecondSemesterActive(): Observable<boolean> {
    return this.http.get<boolean>(
      `./pri/project/evaluation/second-semester/active`
    );
  }

    projects$: Observable<Project[]> = this.http
        .get<Project[]>('./pri/project')
        .pipe(
            retry(3),
            catchError(
                (err: HttpErrorResponse) => throwError(() => err))
        )



    supervisorsAvailability$: Observable<SupervisorAvailability[]> = 
        this.http
            .get<SupervisorAvailability[]>('./pri/project/supervisor/availability')
            .pipe(
                retry(3),
                catchError(
                    (err: HttpErrorResponse) => throwError(() => err))
            )




}