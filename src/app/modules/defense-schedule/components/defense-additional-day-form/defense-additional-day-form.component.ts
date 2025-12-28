import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DefenseScheduleService } from '../../defense-schedule.service';
import { AppComponent } from '../../../../app.component';

@Component({
  selector: 'defense-additional-day-form',
  templateUrl: './defense-additional-day-form.component.html',
  styleUrls: ['./defense-additional-day-form.component.scss']
})
export class DefenseAdditonalDayFormComponent {
  form = this.fb.group({
    date: [null, Validators.required],
  })

  constructor(
    private fb: FormBuilder,
    public app: AppComponent,
  ){}

  formatDate(dateStr: string): string {
    let date = new Date(dateStr);
    
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    
    let newDateStr = `${day}.${month}.${year}`;
    return newDateStr
  }
}
