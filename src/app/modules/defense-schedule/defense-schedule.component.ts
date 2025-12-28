import { Component, OnInit, OnDestroy, } from '@angular/core';
import { DefenseScheduleService } from './defense-schedule.service';
import { SupervisorDefenseAssignmentAggregated, SupervisorStatistics, ChairpersonAssignmentAggregated, ProjectDefense } from './models/defense-schedule.model';
import { Subject, takeUntil } from 'rxjs';
import { State } from 'src/app/app.state';
import { Store } from '@ngrx/store';
import { User } from '../user/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { AreYouSureDialogComponent } from '../shared/are-you-sure-dialog/are-you-sure-dialog.component';
import { DefenseAdditonalDayFormComponent } from './components/defense-additional-day-form/defense-additional-day-form.component';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'defense-schedule',
  templateUrl: './defense-schedule.component.html',
  styleUrls: ['./defense-schedule.component.scss']
})
export class DefenseScheduleComponent implements OnInit, OnDestroy {
  defenseAssignments!: SupervisorDefenseAssignmentAggregated;
  chairpersonAssignments!: ChairpersonAssignmentAggregated;
  unsubscribe$ = new Subject();
  statistics: SupervisorStatistics[] = [];
  user!: User;
  defenses!: ProjectDefense[];
  currentPhase!: string;
  
  constructor(
    private defenseScheduleService: DefenseScheduleService,
    private store: Store<State>,
    private dialog: MatDialog,
    public app: AppComponent
  ){}

  ngOnInit(): void {
    this.store.select('user').subscribe(user => {
      this.user = user;

      if(this.user.role === 'COORDINATOR' || this.user.role === 'SUPERVISOR'){

        this.defenseScheduleService.getSupervisorsDefenseAssignment().pipe(takeUntil(this.unsubscribe$)).subscribe(
          assignments => this.defenseAssignments = assignments
        )
    
        this.defenseScheduleService.getSupervisorsStatistics().pipe(takeUntil(this.unsubscribe$)).subscribe(
          statistics => this.statistics = statistics ?  statistics : []
        )
    
        this.defenseScheduleService.getChairpersonAssignmentAggregated().pipe(takeUntil(this.unsubscribe$)).subscribe(
          assignments => this.chairpersonAssignments = assignments
        )
      }
  
      this.defenseScheduleService.getProjectDefenses().subscribe(
        defenses =>  this.defenses = defenses
      )

      this.defenseScheduleService.getCurrentPhase().pipe(takeUntil(this.unsubscribe$)).subscribe(
        response => this.currentPhase = response.phase
      )
    });
  }

  onStatisticsUpdated(statistics: SupervisorStatistics[]){
    this.statistics = statistics;
  }

  rebuildDefenseSchedule(){
    this.defenseScheduleService.rebuildDefenseSchedule().pipe(takeUntil(this.unsubscribe$)).subscribe(
      () => window.location.reload()
    )
  }

  archiveDefenseSchedule(){
    this.defenseScheduleService.archiveDefenseSchedule().pipe(takeUntil(this.unsubscribe$)).subscribe(
      () => window.location.reload()
    )
  }

  openAdditionalDayDialog(): void {
    const dialogRef = this.dialog.open(DefenseAdditonalDayFormComponent);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.defenseScheduleService.additionalDay(result).pipe(takeUntil(this.unsubscribe$))
          .subscribe(() => window.location.reload())
      }
    });
  }

  openAreYouSureDialog(action: string): void {
    const actionMap: {[key: string]: { translationKey: string, defaultName: string, action: Function}} = {
      'rebuild': {
        translationKey: 'rebuild_warning',
        defaultName: 'rebuild defense schedule - schedule will be irreversibly removed, you will need to create a new one',
        action: this.rebuildDefenseSchedule.bind(this),
      },
      'archive': {
        translationKey: 'archive_warning',
        defaultName: 'archive defense schedule - schedule will be irreversibly archived, you will need to create a new one',
        action: this.archiveDefenseSchedule.bind(this),
      }
    }

    const dialogRef = this.dialog.open(AreYouSureDialogComponent, {
      data: { actionName: this.app.translations[actionMap[action].translationKey] || actionMap[action].defaultName },
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        actionMap[action].action()
      }
    });
  }

  get showDefenseScheduleConfig(): boolean {
    return this.user?.role === 'COORDINATOR' && this.defenseAssignments === null;
  }

  get showSupervisorAccessibilitySurvey(): boolean {
    return this.user?.role === 'SUPERVISOR' && this.currentPhase === 'DEFENSE SCHEDULE PLANNING';
  }

  get showCommitteeSelectionSurvey(): boolean {
    return (this.user?.role === 'COORDINATOR' || (this.user?.role === 'SUPERVISOR' && this.currentPhase !== 'DEFENSE SCHEDULE PLANNING')) && this.defenseAssignments !== null;
  }

  get showDefensesList(): boolean {
    return this.user?.role === 'STUDENT' || this.user?.role === 'PROJECT_ADMIN';
  }

  get showRebuildDefenseScheduleButton(): boolean {
    return this.user?.role === 'COORDINATOR' && this.defenseAssignments !== null;
  }

  get showArchiveDefenseScheduleButton(): boolean {
    return this.user?.role === 'COORDINATOR' && this.defenseAssignments !== null;
  }

  get showAdditionalDayButton(): boolean {
    return this.user?.role === 'COORDINATOR' && this.defenseAssignments !== null;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete()
  }
}