import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DefenseScheduleService } from '../../defense-schedule.service';
import { AppComponent } from '../../../../app.component';

@Component({
  selector: 'defense-date-range-selection',
  templateUrl: './defense-date-range-selection.component.html',
  styleUrls: ['./defense-date-range-selection.component.scss']
})
export class DefenseDateRangeSelectionComponent {
  form = this.fb.group({
    startDate: [null, Validators.required],
    endDate: [null, Validators.required],
    slotDuration: [null, Validators.required],
    startTime: [null, Validators.required],
    endTime: [null, Validators.required],
  })

  constructor(
    private fb: FormBuilder,
    private defenseScheduleService: DefenseScheduleService,
    public app: AppComponent,
  ){}

  formatDate(dateStr: string): string {
    let date = new Date(dateStr);
    
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript
    let year = date.getFullYear();
    
    let newDateStr = `${day}.${month}.${year}`;
    return newDateStr
  }

  onSubmit(): void {
    if (this.form.valid) {    
      this.defenseScheduleService.setScheduleConfig(
        {
          dateRange: {
            start: this.formatDate(this.form.controls.startDate.value!),
            end: this.formatDate(this.form.controls.endDate.value!),
          },
          slotDuration: this.form.controls.slotDuration.value!,
          timeRange: {
            start: this.form.controls.startTime.value!,
            end: this.form.controls.endTime.value!,
          }
        }
      ).subscribe(
        () => window.location.reload()
      )
    }
  }
}
