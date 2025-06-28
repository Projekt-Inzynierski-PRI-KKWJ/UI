import { Component, OnDestroy, OnInit, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Supervisor } from 'src/app/modules/user/models/supervisor.model';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { changeFilters } from '../../state/project.actions';
import { getFilters } from '../../state/project.selectors';
import { UserService } from 'src/app/modules/user/user.service';
import { MatSelectChange } from '@angular/material/select';
import { predefinedViews } from './predefinedViews';

@Component({
  selector: 'project-filters',
  templateUrl: './project-filters.component.html',
  styleUrls: ['./project-filters.component.scss']
})
export class ProjectFiltersComponent implements OnInit, OnChanges, OnDestroy {
  @Input() externalLinkColumnHeaders!: string[];
  displayedColumns: string[] = [];
  selectedView!: {id: string, columns: string[]};
  predefinedViews!: {id: string, name: string, columns: string[]}[];
  supervisors$!: Observable<Supervisor[]>
  searchValue: string = '';
  supervisorIndexNumber!: string | undefined;
  acceptanceStatus!: boolean | undefined;
  criteriaMetStatus: boolean | undefined;
  unsubscribe$ = new Subject()

  constructor(
    private userService: UserService, 
    private store: Store<State>,
  ){}

  ngOnInit(): void {
    this.predefinedViews = JSON.parse(JSON.stringify(predefinedViews));
    this.supervisors$ = this.userService.supervisors$;
    this.selectedView = this.allColumnsView!;
    this.store.select(getFilters).pipe(takeUntil(this.unsubscribe$)).subscribe(
      filters => {
        this.searchValue = filters.searchValue;
        this.supervisorIndexNumber = filters.supervisorIndexNumber;
        this.acceptanceStatus = filters.acceptanceStatus;
        this.displayedColumns = filters.columns;
      }
    )
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['externalLinkColumnHeaders'].previousValue === undefined){
      this.projectGroupsView!.columns = [...this.projectGroupsView!.columns, ...this.externalLinkColumnHeaders]
      this.allColumnsView!.columns = [...this.allColumnsView!.columns, ...this.externalLinkColumnHeaders]
      this.displayedColumns = this.predefinedViews.find(view => view.id === 'ALL')!.columns;
      this.onFiltersChange();
    }
  }

  onViewChange(event: MatSelectChange){
    this.displayedColumns = event.value.columns;
    this.onFiltersChange();
  }

  onFiltersChange(){
    this.store.dispatch(changeFilters({filters: {
      searchValue: this.searchValue,
      supervisorIndexNumber: this.supervisorIndexNumber,
      acceptanceStatus: this.acceptanceStatus,
      columns: this.displayedColumns,
      criteriaMetStatus: this.criteriaMetStatus
    }}))
  }

  resetFilters(){
    this.searchValue = '';
    this.acceptanceStatus = undefined;
    this.supervisorIndexNumber = undefined;
    this.criteriaMetStatus = undefined;
    this.onFiltersChange()
  }

  isAnyFilterActive(): boolean {
    return (
      this.searchValue !== '' || 
      this.supervisorIndexNumber !== undefined || 
      this.acceptanceStatus !== undefined ||
      this.criteriaMetStatus !== undefined
    )
  }

  get allColumnsView() {
    return this.predefinedViews.find(view => view.id === 'ALL');
  }

  get projectGroupsView() {
    return this.predefinedViews.find(view => view.id === 'PROJECT_GROUPS');
  }

  ngOnDestroy(): void {
    this.displayedColumns = [];
    this.resetFilters();
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete()
  }
}
