import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { CriteriaGroup } from 'src/app/modules/project/models/grade.model';
import { AppComponent } from '../../../../../../app.component';

@Component({
  selector: 'radio-criterion-select',
  templateUrl: './radio-criterion-select.component.html',
  styleUrls: ['./radio-criterion-select.component.scss']
})
export class RadioCriterionSelectComponent {
  constructor(public app: AppComponent) {}
  @Input() expanded!: boolean;
  @Input() criteriaGroup!: CriteriaGroup;
  @Input() editable!: boolean;
  @Output() selectCriterionEvent: EventEmitter<string | null> = new EventEmitter();
  criteriaKeys = [
    {
      id: 'CRITERION_NOT_MET',
      points: '0p'
    },
    {
      id: 'UNSUCCESSFUL_ATTEMPT_TO_MEET_THE_CRITERION',
      points: '1p'
    },
    {
      id: 'CRITERION_MET_WITH_RESERVATIONS',
      points: '3p'
    },
    {
      id: 'CRITERION_MET',
      points: '4p'
    },
  ]

  selectCriterion(key: string){
    if(this.editable){
      this.criteriaGroup.selectedCriterion =  key;
      this.selectCriterionEvent.emit(key)
    }
  }
 
  unselectCriterion(){
    if(this.editable){
      this.criteriaGroup.selectedCriterion = null;
      this.selectCriterionEvent.emit(null)
    }
  }
}
