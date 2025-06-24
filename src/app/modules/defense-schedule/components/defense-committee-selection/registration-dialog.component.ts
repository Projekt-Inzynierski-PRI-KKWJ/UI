import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registration-dialog',
  templateUrl: './registration-dialog.component.html',
  styleUrls: ['./registration-dialog.component.scss']
})
export class RegistrationDialogComponent implements OnInit {
  loading = true;
  error: any = null;
  recipients: any[] = [];

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<RegistrationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { studyYear: string, templateName: string }
  ) {}

  ngOnInit(): void {
    const templateName = this.data?.templateName;
    this.http.get(`/pri/notification/receiver-data/${templateName}`).subscribe({
      next: (response: any) => {
        const students = response.students || [];
        const content = response.content || '';

        this.recipients = students.map((student: any) => ({
          ...student,
          content: content
        }));

        this.loading = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  send(): void {
    this.dialogRef.close('send');
  }
}
