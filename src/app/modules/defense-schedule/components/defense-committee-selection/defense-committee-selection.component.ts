import { Component, Input, OnDestroy, OnChanges, OnInit, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DefenseScheduleService } from '../../defense-schedule.service';
import {  ChairpersonAssignment, ProjectDefense, SupervisorDefenseAssignment, SupervisorStatistics } from '../../models/defense-schedule.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil} from 'rxjs';
import { MatSelectChange } from '@angular/material/select';
import { FormControl } from '@angular/forms';
import { UserService } from 'src/app/modules/user/user.service';
import { Supervisor } from 'src/app/modules/user/models/supervisor.model';
import { HttpResponse } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { User } from 'src/app/modules/user/models/user.model';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { MatSnackBar } from '@angular/material/snack-bar';

interface SupervisorTimeReference {
  supervisor: string,
  time: string
}

@Component({
  selector: 'defense-committee-selection',
  templateUrl: './defense-committee-selection.component.html',
  styleUrls: ['./defense-committee-selection.component.scss']
})
export class DefenseCommitteeSelectionComponent implements OnChanges, OnDestroy, OnInit {
  @Input() defenseAssignment!: {[key: string]: { [key: string]: SupervisorDefenseAssignment }};
  @Input() chairpersonAssignment!: {[key: string]: ChairpersonAssignment };
  supervisors!: Supervisor[];
  times: string[] = [];
  statistics: SupervisorStatistics[] = [];
  defenses!: ProjectDefense[];
  @Input() date!: string;
  slotsSelected: boolean = false;
  hoveredSlots: {[key: string]: {[key: string]: boolean}} = {};
  selectedSlots!: {[key: string]: { [key: string]: SupervisorDefenseAssignment }}
  lastSelectedSlots: {[key: string]: {[key: string]: SupervisorDefenseAssignment}} = {};
  lastSelectedSupervisor: string = '';
  start: SupervisorTimeReference = { supervisor: '', time: '' }
  end: SupervisorTimeReference = { supervisor: '', time: '' }
  over: SupervisorTimeReference = { supervisor: '', time: '' }
  cursorPositionY = '';
  cursorPositionX = '';

  user!: User;
  @ViewChild('slotMenu',  {static: false}) slotMenu!: ElementRef

  committeeMultipleSelection: string | null = null;
  classroomFormControls: {[key: string]: FormControl} = {
    'A': new FormControl<string | null>(null),
    'B': new FormControl<string | null>(null),
    'C': new FormControl<string | null>(null),
    'D': new FormControl<string | null>(null)
  }

  supervisorsInCommitties: {[key: string]: string[]} = {
    'A': [],
    'B': [],
    'C': [],
    'D': [],
  }
  existenCommittees: string[] = [];

  currentPhase!: string;

  unsubscribe$ = new Subject();

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent): void {
     if (
        this.slotMenu &&
        !this.slotMenu.nativeElement.contains(event.target) &&
        document.getElementsByClassName('cdk-overlay-container')[0].children.length === 0
      ) {
        // clicked outside => close dropdown list
     this.closeSelectionMenu()
     }
  }

  constructor(
    private defenseScheduleService: DefenseScheduleService,
    private userService: UserService,
    private store: Store<State>,
    private _snackbar: MatSnackBar,
  )
  {
    this.userService.supervisors$.pipe(takeUntil(this.unsubscribe$)).subscribe(
      supervisors => this.supervisors = supervisors
    )

    this.defenseScheduleService.getSupervisorsStatistics().pipe(takeUntil(this.unsubscribe$)).subscribe(
      statistics => this.statistics = statistics
    )

    this.defenseScheduleService.getProjectDefenses().subscribe(
      defenses =>  this.defenses = defenses
    )

    this.store.select('user').subscribe(user => {
      this.user = user;
    });

    this.defenseScheduleService.getCurrentPhase().pipe(takeUntil(this.unsubscribe$)).subscribe(
      phase => this.currentPhase = phase.phase
    )
  }

  ngOnInit(): void {
    ['A', 'B', 'C', 'D'].forEach(committee => {
      this.classroomFormControls[committee].valueChanges.pipe(takeUntil(this.unsubscribe$), debounceTime(500), distinctUntilChanged())
      .subscribe((value: string | null) => {
          let classroom = value;
          if(classroom === '') classroom = null;
          this.chairpersonAssignment[committee].classroom = classroom;
          this.updateChairpersonAssignment(this.chairpersonAssignment[committee])
      })
    })
  }


  ngOnChanges(): void {
    this.selectedSlots = this.defenseAssignment;
    if(this.selectedSlots){
      for(let supervisor of Object.keys(this.selectedSlots)){
        this.hoveredSlots[supervisor] = {};
        this.lastSelectedSlots[supervisor] = {};

        for(let time of Object.keys(this.selectedSlots[supervisor])){
          if(this.times.indexOf(time) === -1){
            this.times.push(time);
          }
          this.hoveredSlots[supervisor][time] = false;
        }
      }
    }

    this.updateExistenCommitties()

    if(this.chairpersonAssignment){
      for(let assignment of Object.values(this.chairpersonAssignment)){
        this.classroomFormControls[assignment.committeeIdentifier].setValue(assignment.classroom);
      }
    }
  }

  isChairperson(defenseAssignment: SupervisorDefenseAssignment): boolean {
    return defenseAssignment.committeeIdentifier !== null && this.chairpersonAssignment[defenseAssignment.committeeIdentifier].chairpersonId === defenseAssignment.supervisorId;
  }

  updateChairpersonAssignment(chairpersonAssignment: ChairpersonAssignment){
    this.defenseScheduleService.updateChairpersonAssignment(chairpersonAssignment).pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        result => {
          this.statistics = result.statistics;
          this.defenses = result.defenses;
        }
      )
  }

  updateCommitteeSchedule(slots: {[key: string]: SupervisorDefenseAssignment}){
    this.defenseScheduleService.updateCommitteeSchedule(slots).pipe(takeUntil(this.unsubscribe$)).subscribe(
      result => {
        this.statistics = result.statistics;
        this.defenses = result.defenses;
      }
    )
    this.updateExistenCommitties()
  }

  multipleCommitteeSelectionChanged(event: MatSelectChange){
    const supervisor = this.lastSelectedSupervisor;
    for(let t of Object.keys(this.lastSelectedSlots[supervisor])){
      this.lastSelectedSlots[supervisor][t].committeeIdentifier = event.value;
      this.selectedSlots[supervisor][t].committeeIdentifier = event.value;
    }
    this.updateCommitteeSchedule(this.lastSelectedSlots[supervisor])
  }

  committeeChairpersonSelected(event: MatSelectChange, committeeIdentifier: string){
    this.chairpersonAssignment[committeeIdentifier].chairpersonId = event.value;

    if(event.value === null){
      for(let supervisor of Object.keys(this.selectedSlots)){
        this.hoveredSlots[supervisor] = {};
        this.lastSelectedSlots[supervisor] = {};

        for(let time of Object.keys(this.selectedSlots[supervisor])){
          if(this.selectedSlots[supervisor][time].committeeIdentifier === committeeIdentifier){
            this.selectedSlots[supervisor][time].committeeIdentifier = null;

          }
         this.hoveredSlots[supervisor][time] = false;
        }
      }
    }

    this.updateChairpersonAssignment(this.chairpersonAssignment[committeeIdentifier])
    this.updateExistenCommitties()
  }

  unselectSlots(){
    const supervisorId = this.lastSelectedSupervisor;
    for(let t of Object.keys(this.lastSelectedSlots[supervisorId])){
        if(this.isChairperson(this.lastSelectedSlots[supervisorId][t])){
          this.supervisors.forEach(supervisor => {
            if(this.selectedSlots[supervisor.id][t].committeeIdentifier === this.lastSelectedSlots[supervisorId][t].committeeIdentifier){
              this.selectedSlots[supervisor.id][t].committeeIdentifier = null
            }
          })
        }
        this.lastSelectedSlots[supervisorId][t].committeeIdentifier = null
        this.selectedSlots[supervisorId][t].committeeIdentifier = null

    }

    this.updateCommitteeSchedule(this.lastSelectedSlots[supervisorId])

    for(let supervisor of Object.keys(this.selectedSlots)){
      this.lastSelectedSlots[supervisor] = {};
    }
    this.slotsSelected = false;
  }

  closeSelectionMenu(){
    for(let supervisor of Object.keys(this.selectedSlots)){
      this.lastSelectedSlots[supervisor] = {};
    }
    this.slotsSelected = false;
  }

  getDefenseSummary(){
    this.defenseScheduleService.getDefenseSummary().pipe(takeUntil(this.unsubscribe$)).subscribe(
      (file: HttpResponse<Blob>) => {
        if(file?.body){
          saveAs(file.body!, 'summary.csv');
          this._snackbar.open('Summary successfully exported', 'close')
        }
      }
    )
  }

  resetSlotsSelection(){
    this.start = { supervisor: '', time: '' };
    this.end = { supervisor: '', time: '' };
    this.supervisors.forEach(supervisor => {
      this.hoveredSlots[supervisor.id] = {};
      this.times.forEach(time => {
        this.hoveredSlots[supervisor.id][time] = false;
      })
    });
  }


  onMouseDown(supervisor: string, time: string){
    if(this.user.role === 'COORDINATOR'){
      for(let supervisor of Object.keys(this.selectedSlots)){
        this.lastSelectedSlots[supervisor] = {};
      }
      this.slotsSelected = false;
      this.hoveredSlots[supervisor][time] = true;
      this.start = {supervisor, time}
    }
  }

  onMouseEnter(supervisor: string, time: string){
    if(this.start.supervisor === supervisor){
      if(this.start.time !== time){
        this.hoveredSlots[supervisor][time] = true;
      }
      this.over = {supervisor, time};

      const startIndex = this.times.indexOf(this.start.time);
      const overIndex = this.times.indexOf(this.over.time);

      for(let t of Object.keys(this.hoveredSlots[supervisor])){
        const timeIndex = this.times.indexOf(t);

        if(timeIndex > startIndex && timeIndex > overIndex){
          this.hoveredSlots[supervisor][t] = false;
        }
      }
    } else {
      this.resetSlotsSelection()
    }
  }

  findCellTargetElement(event: MouseEvent): HTMLElement{
    let target = event.target as HTMLElement;
    while(target.tagName !== 'TD'){
      target = target.parentElement!;
    }
    return target;
  }

  calculateCommitteeSelectionContainerPosition(target: HTMLElement){
    let rect = target.getBoundingClientRect();
    let matTabBodyRect = document.getElementsByClassName('mat-mdc-tab-body-active')[0].getBoundingClientRect();
    this.cursorPositionX = `${rect.x + rect.width - matTabBodyRect.x}px`;
    this.cursorPositionY = `${rect.y - matTabBodyRect.y}px`;
  }

  openSelectionMenu(){
    this.slotsSelected = true;
  }

  onMouseUp(supervisor: string, time: string, event: MouseEvent){
    this.end = {supervisor, time};
    const startIndex = this.times.indexOf(this.start.time);
    const endIndex = this.times.indexOf(this.end.time);

    let target = this.findCellTargetElement(event);
    this.calculateCommitteeSelectionContainerPosition(target);

    let countAlreadySelectedSlots = 0;

    if(this.end.supervisor === this.start.supervisor){
      this.slotsSelected = true;

      for(let t of Object.keys(this.selectedSlots[supervisor])){
        const timeIndex = this.times.indexOf(t);
        const committeeIdentifier = this.selectedSlots[supervisor][t].committeeIdentifier;

        if((timeIndex >= startIndex && timeIndex <= endIndex) || (timeIndex <= startIndex && timeIndex >= endIndex)){
          committeeIdentifier ? countAlreadySelectedSlots++ : this.selectedSlots[supervisor][t].committeeIdentifier = 'A';
          const selectedSlotDeepCopy = JSON.parse(JSON.stringify(this.selectedSlots[supervisor][t]));
          this.lastSelectedSlots[supervisor][t] = selectedSlotDeepCopy;
        }
      }

      if(Object.keys(this.lastSelectedSlots[supervisor]).length !== countAlreadySelectedSlots){
        this.updateCommitteeSchedule(this.lastSelectedSlots[supervisor]);
      }


      let countSameCommittee = 0;
      for(let t of Object.keys(this.lastSelectedSlots[supervisor])){
        if(this.lastSelectedSlots[supervisor][t].committeeIdentifier === this.selectedSlots[supervisor][this.start.time].committeeIdentifier){
          countSameCommittee++;
        }
      }

      const everySlotHasSameCommittee = countSameCommittee === Object.keys(this.lastSelectedSlots[supervisor]).length;
      this.committeeMultipleSelection = everySlotHasSameCommittee ? this.selectedSlots[supervisor][this.start.time].committeeIdentifier : this.committeeMultipleSelection = null;

      this.lastSelectedSupervisor = this.start.supervisor;
    }

    this.resetSlotsSelection();
  }

  chairpersonCandidates(committee: string): Supervisor[] {
    return this.supervisors.filter(supervisor => this.supervisorsInCommitties[committee].includes(supervisor.id))
  }

  doesCommitteeExist(committee: string): boolean {
    return this.existenCommittees.includes(committee);
  }

  updateExistenCommitties(){
    this.existenCommittees = [];
    ['A', 'B', 'C', 'D'].forEach(committee => {
      this.supervisorsInCommitties[committee] = [];
    })

    for(let supervisor of Object.keys(this.selectedSlots)){
      for(let time of Object.keys(this.selectedSlots[supervisor])){
        ['A', 'B', 'C', 'D'].forEach(committee => {
          if(this.selectedSlots[supervisor][time].committeeIdentifier === committee){
            if(!this.supervisorsInCommitties[committee].includes(supervisor)){
              this.supervisorsInCommitties[committee].push(supervisor);
            }
            if(!this.existenCommittees.includes(committee)){
              this.existenCommittees.push(committee);
            }
          }
        })
      }
    }
  }

  isProjectAssigned(time: string, committeeIdentifier: string | null): boolean {
    const defense = this.defenses?.find(defense => defense.date === this.date && defense.time === time && defense.committeeIdentifier === committeeIdentifier);
    return defense !== undefined && defense.projectId !== null
  }

  openRegistration(){
    this.defenseScheduleService.openRegistration().pipe(takeUntil(this.unsubscribe$)).subscribe(
      phase => {
        this.currentPhase = phase.phase;
        this._snackbar.open('Registration successfully opened', 'close')
      }
    )
  }


  closeRegistration(){
    this.defenseScheduleService.closeRegistration().pipe(takeUntil(this.unsubscribe$)).subscribe(
      phase =>  {
        this.currentPhase = phase.phase;
        this._snackbar.open('Registration successfully closed', 'close')
      }
    )
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete()
  }



}
