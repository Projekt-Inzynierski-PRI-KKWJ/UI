import { Component, OnDestroy, OnInit } from '@angular/core';
import { SupervisorAvailability} from '../../models/supervisor-availability.model';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Student } from 'src/app/modules/user/models/student.model';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, catchError, takeUntil} from 'rxjs';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { ActivatedRoute, Router } from '@angular/router';
import { UserState } from 'src/app/modules/user/state/user.state';
import { acceptProject, acceptProjectSuccess, removeProject, removeProjectSuccess, unacceptProject, unacceptProjectSuccess, updateGradingPhase } from '../../state/project.actions';
import { Actions, ofType } from '@ngrx/effects';
import { ProjectRemoveDialogComponent } from '../project-remove-dialog/project-remove-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectDetails } from '../../models/project.model';
import { EvaluationCards, PhaseChangeResponse } from '../../models/grade.model';
import { GradeService } from '../../services/grade.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { AreYouSureDialogComponent } from 'src/app/modules/shared/are-you-sure-dialog/are-you-sure-dialog.component';
import { FormGroup, FormArray, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ExternalLinkService } from '../../services/external-link.service';


enum ROLE {
  FRONTEND = 'front-end',
  BACKEND = 'back-end',
  FULLSTACK = 'full-stack',
  SUPERVISOR = 'supervisor',
}

@Component({
    selector: 'project-details',
    templateUrl: './project-details.component.html',
    styleUrls: ['./project-details.component.scss']
})

export class ProjectDetailsComponent implements OnInit, OnDestroy {
  members!: MatTableDataSource<Student>;
  selection = new SelectionModel<Student>(false, []);
  selectedItem = <Student>{};
  columns = ['name', 'email', 'role', 'status']
  unsubscribe$ = new Subject();
  maxAvailabilityFilled: boolean = false;
  data!: ProjectDetails;
  user!: UserState;
  evaluationCards!: EvaluationCards;
  gradesShown = true;
  criteriaShown = true;
  grade: string = '0%';
  criteriaMet = false;
  objectKeys = Object.keys;
  selectedSemesterIndex = 0;
  selectedPhaseIndex = 0;
  selectedCriteria = '';
  
  semesterMap: {[key: number]: string} = {
    0: 'FIRST',
    1: 'SECOND'
  }
  phaseMap: {[key: number]: string} = {
    0: 'SEMESTER_PHASE',
    1: 'DEFENSE_PHASE',
    2: 'RETAKE_PHASE'
  }

  criteriaData = {
    firstSemester: [
      { name: 'Attendance', value: '95%' },
      { name: 'Assignments', value: 'A' }
    ],
    secondSemester: [
      { name: 'Attendance', value: '90%' },
      { name: 'Project', value: 'B+' }
    ]
  };
  
  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store<State>,
    private actions$: Actions,
    private dialog: MatDialog,
    private router: Router,
    private _snackbar: MatSnackBar,
    private gradeService: GradeService,
    private fb: FormBuilder,
    private externalLinkService: ExternalLinkService

  ){}

  projectCriteria: FormGroup = this.fb.group({
    criteriaList: this.fb.array([]) // <-- lista dodanych kryteriów
  });

  criteriaList: any[] = [
    { criterium: 'Współpraca', levelOfRealization: 3, semester: 'semester1' },
    { criterium: 'Kreatywność', levelOfRealization: 4, semester: 'semester2' },
    // dodaj więcej danych zgodnie z potrzebą
  ];

  getCriteriaForSemester(semester: string) {
    return this.criteriaList.filter(c => c.semester === semester);
    
  }
   
  ngOnInit(): void {
    document.getElementsByClassName('mat-drawer-content')[0].scrollTo(0, 0);
    
    this.activatedRoute.data.subscribe(({projectDetails, supervisorAvailability, evaluationCards}) => {
      this.data = projectDetails;
      this.members = new MatTableDataSource<Student>([
        {...this.data?.supervisor!, 
          role: 'SUPERVISOR', 
          accepted:  this.data?.accepted
        },
        ...this.data?.students!  
      ])

      if(evaluationCards.status === 204){
        this.gradesShown = false;
        this._snackbar.open('Evaluation cards are locked at the moment', 'close');
      } else {
        this.evaluationCards = evaluationCards.body;
      }

      this.gradesShown = this.evaluationCards !== undefined && this.evaluationCards !== null;
     
      let projectSupervisorAvailability = supervisorAvailability.find(
        (availability: SupervisorAvailability) => availability.supervisor.indexNumber === this.data.supervisor?.indexNumber
      )
      if(projectSupervisorAvailability){
        this.maxAvailabilityFilled = projectSupervisorAvailability?.assigned === projectSupervisorAvailability?.max
      }
      
      this.selectedSemesterIndex = this.selectedSemester;
      this.selectedPhaseIndex = this.selectedPhase;
    })

    this.store.select('user').pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      this.user = user;
    });
  }

  onGradeChange({grade, criteriaMet, selectedCriteria}: {grade: string, criteriaMet: boolean, selectedCriteria: string}){
    this.grade = grade;
    this.criteriaMet = criteriaMet;
    this.selectedCriteria = selectedCriteria;
  }

  acceptProject(): void {
    this.store.dispatch(acceptProject({projectId: this.data.id!, role: this.user.role}))
    this.actions$.pipe(ofType(acceptProjectSuccess),takeUntil(this.unsubscribe$),).subscribe(() => {
      this.members = new MatTableDataSource<Student>([
        {...this.data?.supervisor!, role: 'SUPERVISOR', accepted:  this.data?.accepted},
        ...this.data?.students!
        ].map(
          member => {
            if(member.indexNumber === this.user.indexNumber){
              member.accepted = true;
            } 
            return member
          }
        ))
        this._snackbar.open('Project successfully accepted', 'close');
    });
  }

  isProjectAdmin(member: Student){
    return  member.indexNumber === this.data.admin
  }

  isSupervisor(member: Student){
    return  member.indexNumber === this.data.supervisor.indexNumber
  }

  unacceptProject(): void {
    this.store.dispatch(unacceptProject({projectId: this.data.id!, role: this.user.role}))
    this.actions$.pipe(ofType(unacceptProjectSuccess),takeUntil(this.unsubscribe$),).subscribe(() => {
      this.members = new MatTableDataSource<Student>([
        {...this.data?.supervisor!, role: 'SUPERVISOR', accepted:  this.data?.accepted},
        ...this.data?.students!
        ].map(
          member => {
            if(member.indexNumber === this.user.indexNumber){
              member.accepted = false;
            } 
            return member
          }
        ))
        this._snackbar.open('Project successfully unaccepted', 'close');
    })
  }

  editProject(){
    this.router.navigate([{outlets: {modal: `projects/form/${this.data.id}`}}], { queryParams: {comingFromDetailsPage: true} });
  }

  addCriteria(){
    this.router.navigate([{outlets: {modal: `projects/add-criteria/${this.data.id}`}}], { queryParams: {comingFromDetailsPage: true} });
  }

  openRemoveProjectDialog(){
    const dialogRef = this.dialog.open(ProjectRemoveDialogComponent, {
      data: { projectName: this.data.name},
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.store.dispatch(removeProject({projectId: this.data.id!}))
        this.actions$.pipe(ofType(removeProjectSuccess),takeUntil(this.unsubscribe$),).subscribe(() => {
          this.router.navigate([{outlets: {modal: null}}]);
          this._snackbar.open('Project successfully removed', 'close');
        })
      }
    });
  }

  openAreYouSureDialog(action: string): void {
    const actionMap: {[key: string]: { name: string, action: Function}} = {
      'publish': {
        name: 'publish evaluation cards and unlock them for students to view.',
        action: this.publish.bind(this),
      },
      'retake': {
        name: `activate retake's evaluation card`,
        action: this.openRetakePhase.bind(this),
      },
      'freeze': {
        name: `block the semester's evaluation card and activate the defense's evaluation card, evaluation cards won't be available for students to view until they are published`,
        action: this.freezeGrading.bind(this),
      }
    }

    const dialogRef = this.dialog.open(AreYouSureDialogComponent, {
      data: { actionName: actionMap[action].name },
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        actionMap[action].action()
      }
    });
  }

  onSemesterTabChange(event: MatTabChangeEvent) {
  this.selectedSemesterIndex = event.index;

  // Załóżmy, że zakładka "Criteria" ma indeks 2
  this.criteriaShown = event.index !== 2;

  if (this.gradesShown && this.criteriaShown) {
    this.grade = this.evaluationCards[this.semesterMap[this.selectedSemesterIndex]][this.phaseMap[this.selectedPhaseIndex]].grade!;
  }
}

  onPhaseTabChange(event: MatTabChangeEvent){
    this.selectedPhaseIndex = event.index;
    this.grade = this.evaluationCards[this.semesterMap[this.selectedSemesterIndex]][this.phaseMap[this.selectedPhaseIndex]].grade!;
  }

  freezeGrading(){
    this.gradeService.freezeGrading(this.data.id!).pipe(takeUntil(this.unsubscribe$),).subscribe(
        (response: PhaseChangeResponse) => {
          this._snackbar.open('Successful freeze', 'close');
          this.data.freezeButtonShown = false;
          this.data.publishButtonShown = true;
          this.evaluationCards = response.evaluationCards;
          this.store.dispatch(updateGradingPhase({projectId: this.data.id!, phase: response.phase }))
          this.selectedSemesterIndex = this.selectedSemester;
          this.selectedPhaseIndex = this.selectedPhase;
        }
    );
  }

  openRetakePhase(){
    this.gradeService.openRetakePhase(this.data.id!).pipe(takeUntil(this.unsubscribe$))
      .subscribe((response: PhaseChangeResponse) => {
        this._snackbar.open('Successful retake phase opening', 'close');
        this.data.retakeButtonShown = false;
        this.data.publishButtonShown = false;
        this.evaluationCards = response.evaluationCards;
        this.store.dispatch(updateGradingPhase({projectId: this.data.id!, phase: response.phase }))
        this.selectedSemesterIndex = this.selectedSemester;
        this.selectedPhaseIndex = this.selectedPhase;
      }
    );
  }

  publish(){
    this.gradeService.publish(this.data.id!).pipe(takeUntil(this.unsubscribe$))
      .subscribe((response: PhaseChangeResponse) => {
        this._snackbar.open('Successful publishing', 'close');
        this.data.retakeButtonShown = false;
        this.data.publishButtonShown = false;
        this.evaluationCards = response.evaluationCards;
        this.store.dispatch(updateGradingPhase({projectId: this.data.id!, phase: response.phase }))
        this.selectedSemesterIndex = this.selectedSemester;
        this.selectedPhaseIndex = this.selectedPhase;
      }
    );
  }

  getEvaluationCardsTranslations(key: string): string{
    const translations: {[key: string]: string} = {
      'FIRST': 'First semester',
      'SECOND': 'Second semester',
      'SEMESTER_PHASE': 'Semester phase',
      'DEFENSE_PHASE': 'Defense phase',
      'RETAKE_PHASE': 'Retake phase',
    }

    return translations[key];
  }

  getRole(role: keyof typeof ROLE): string {
    return ROLE[role]
  }

  navigateBack(){
    this.router.navigate([{outlets: {modal: null}}]);
  }

  downloadExternalLinkFile(externalLinkId: string): void {
    if (this.data?.id) {
      const downloadUrl = this.externalLinkService.getExternalLinkFileDownloadUrl(
        this.data.id, 
        externalLinkId
      );
      
      // Create a temporary a element
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from external link data
      const externalLink = this.data.externalLinks?.find(link => link.id === externalLinkId);
      if (externalLink?.originalFileName) {
        link.download = externalLink.originalFileName;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  get selectedSemester(): number {
    for(let semester in this.evaluationCards){
      for(let phase in this.evaluationCards[semester]){
        if(this.evaluationCards[semester][phase].active){
          return semester === 'FIRST' ? 0 : 1
        }
      }
    }
    return 0;
  }

  get selectedPhase(): number {
    for(let semester in this.evaluationCards){
      for(let phase in this.evaluationCards[semester]){
        if(this.evaluationCards[semester][phase].active){
          if(phase === 'SEMESTER_PHASE'){
            return 0;
          } else if(phase === 'DEFENSE_PHASE'){
            return 1;
          } else if(phase === 'RETAKE_PHASE'){  
            return 2;
          }
        }
      }
    }
    return 0;
  }

  get showExternalLinks(): boolean{
   return this.user.acceptedProjects.includes(this.data.id!) || 
          this.user.role === 'COORDINATOR' || 
          this.user.role === 'SUPERVISOR'
  }

  get sortedExternalLinks() {
    if (!this.data?.externalLinks) {
      return [];
    }
    return [...this.data.externalLinks].sort((a, b) => a.name.localeCompare(b.name));
  }
  
  get showUnacceptButton(){
    return this.user.role === 'STUDENT' && this.user.acceptedProjects.includes(this.data.id!) && !this.data.accepted
  }

  get showFreezeGradingButton(){
    return this.data.freezeButtonShown
  }

  get showOpenRetakePhaseButton(){
    return this.data.retakeButtonShown
  }

  get showPublishButton(){
    return this.data.publishButtonShown
  }

  get showEditButton(){
    if(
      (this.user.role === 'PROJECT_ADMIN' && 
       this.user.acceptedProjects.includes(this.data.id!)
      )
      ||
      (this.user.role === 'COORDINATOR')
    ){
      return true
    } else {
      return false
    }
  }

  get showAcceptButton(){
    if(
      (this.user.role === 'STUDENT' && 
      this.user.acceptedProjects.length === 0 && 
      this.user.projects.includes(this.data.id!))
      ||
      ((this.user.role === 'SUPERVISOR' || this.user.role === 'COORDINATOR') &&
      !this.user.acceptedProjects.includes(this.data.id!) &&
      this.user.projects.includes(this.data.id!) &&
      this.data.confirmed &&
      !this.maxAvailabilityFilled)
     ){
       return true
     } else {
       return false
     }
  }
  
  get showRemoveButton(){
    if(
      (this.user.role === 'PROJECT_ADMIN' && 
       this.user.acceptedProjects.includes(this.data.id!) &&
       !this.data.accepted
      )
      ||
      (this.user.role === 'COORDINATOR')
    ){
      return true
    } else {
      return false
    }
  }

  get showAddCriteriaButton(){
    if(
      (this.user.role === 'PROJECT_ADMIN' && 
       this.user.acceptedProjects.includes(this.data.id!)
      )
      ||
      (this.user.role === 'COORDINATOR')
      ||
      ((this.user.role === 'SUPERVISOR') &&
      this.user.acceptedProjects.includes(this.data.id!))
    ){
      return true
    } else {
      return false
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete()
  }
}
