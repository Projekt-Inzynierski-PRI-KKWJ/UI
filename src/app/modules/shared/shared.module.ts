import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreYouSureDialogComponent } from './are-you-sure-dialog/are-you-sure-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@NgModule({
  declarations: [
    AreYouSureDialogComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  exports: [
    AreYouSureDialogComponent,
    ConfirmDialogComponent,
  ]
})
export class SharedModule { }
