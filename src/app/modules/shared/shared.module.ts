import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreYouSureDialogComponent } from './are-you-sure-dialog/are-you-sure-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';

@NgModule({
  declarations: [
    AreYouSureDialogComponent,
    ConfirmDialogComponent,
    HelpDialogComponent,
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ],
  exports: [
    AreYouSureDialogComponent,
    ConfirmDialogComponent,
    HelpDialogComponent,
  ]
})
export class SharedModule { }
