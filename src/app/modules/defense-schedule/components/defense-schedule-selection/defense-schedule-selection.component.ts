import { Component, ViewChild, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DefenseScheduleService } from '../../defense-schedule.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Project, ProjectDefense } from '../../models/defense-schedule.model';
import { MatSelectChange } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { User } from 'src/app/modules/user/models/user.model';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppComponent } from '../../../../app.component';

@Component({
  selector: 'defense-schedule-selection',
  templateUrl: './defense-schedule-selection.component.html',
  styleUrls: ['./defense-schedule-selection.component.scss']
})
export class DefenseScheduleSelectionComponent implements OnInit, OnDestroy, OnChanges {
  columns = ['date', 'time', 'committeeIdentifier', 'project', 'class', 'students', 'committee' ]
  @ViewChild(MatPaginator, {static: false}) paginator!: MatPaginator;
  @ViewChild(MatSort, {static: false}) sort!: MatSort;
  dataSource!: MatTableDataSource<ProjectDefense>;
  projects: Project[] = [];
  unsubscribe$ = new Subject();
  user!: User;
  @Input() defenses!: ProjectDefense[];
  updatedDefenses: ProjectDefense[] = [];

  constructor(
    private defenseScheduleService: DefenseScheduleService,
    private store: Store<State>,
     private _snackbar: MatSnackBar,
    public app: AppComponent,
    ){}

  ngOnInit(): void {
    this.defenseScheduleService.getProjects().subscribe(
      projects => this.projects = projects
    )

    this.store.select('user').subscribe(user => {
      this.user = user;
      if(this.user.role === 'PROJECT_ADMIN'){
        this.columns = ['checkbox', ...this.columns]
      }
    });

    this.dataSource = new MatTableDataSource<ProjectDefense>([]);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.defenses){
      this.dataSource = new MatTableDataSource<ProjectDefense>(this.defenses);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  updateDefenses(){
    this.defenseScheduleService.updateProjectDefenses(this.defenses)
      .pipe(takeUntil(this.unsubscribe$)).subscribe(defenses => {
        this.defenses = defenses;
        this.dataSource = new MatTableDataSource<ProjectDefense>(defenses);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this._snackbar.open('Defenses successfully updated', 'close', {
            panelClass: ['success-snackbar']})
  })
  }

  doesDefenseIncludeMyProject(projectId: string): boolean {
    return this.user.acceptedProjects.map(id => Number(id)).includes(Number(projectId))
  }

  defenseSelected(defenseId: string){
    this.defenseScheduleService.updateProjectDefense(defenseId, String(this.user.acceptedProjects[0]))
      .pipe(takeUntil(this.unsubscribe$)).subscribe(defenses => { 

        if(defenses.find(def => def.projectDefenseId === defenseId)?.projectId === String(this.user.acceptedProjects[0])){
          this._snackbar.open('Defense successfully registered', 'close', {
            panelClass: ['success-snackbar']});
        } else {
          this._snackbar.open('Unfortunately, another team has already registered, please select another slot', 'close', { panelClass: ['error-snackbar']});
        }
        
        this.defenses = defenses;
        this.dataSource = new MatTableDataSource<ProjectDefense>(defenses);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
  }

  getDefenseDayForProject(projectId: string): string {
    return this.defenses.find(defense => defense.projectId === projectId)?.date || '';
  }

  get registeredDefenses(): string {
    return `${this.defenses?.filter(defense => defense.projectId !== null).length.toString()}/${this.defenses?.length.toString()}`
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
