import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'project-remove-dialog',
  templateUrl: './project-remove-dialog.component.html',
  styleUrls: ['./project-remove-dialog.component.scss']
})
export class ProjectRemoveDialogComponent {
  Field = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: any){}


}