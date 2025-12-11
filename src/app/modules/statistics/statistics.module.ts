import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsComponent } from './statistics.component';
import { StatisticsRoutingModule } from './statistics-routing.module';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [
    StatisticsComponent
  ],
  imports: [
    CommonModule,
    StatisticsRoutingModule,
    MatCardModule,
    NgChartsModule 
  ]
})
export class StatisticsModule {}
