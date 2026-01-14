import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface HelpDialogData {
  title: string;
  tabs: HelpTab[];
}

export interface HelpTab {
  id: string;
  label: string;
  content: string;
}

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent {
  activeTab: string;

  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HelpDialogData
  ) {
    this.activeTab = data.tabs[0]?.id || '';
  }

  close(): void {
    this.dialogRef.close();
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }
}
