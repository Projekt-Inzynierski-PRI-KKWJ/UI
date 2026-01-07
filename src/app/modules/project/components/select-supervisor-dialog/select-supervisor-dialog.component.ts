import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'select-supervisor-dialog',
  templateUrl: './select-supervisor-dialog.component.html',
  styleUrls: ['./select-supervisor-dialog.component.scss']
})
export class SelectSupervisorDialogComponent implements OnInit {
  supervisors: any[] = [];
  selectedSupervisorId: any = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<SelectSupervisorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number, headers?: HttpHeaders | any }
  ) {}

  ngOnInit(): void {
    this.loadSupervisors();
  }

  loadSupervisors(): void {
    this.isLoading = true;
    this.error = null;

    const headers = this.data.headers || {};

    // Try the project-market supervisor endpoint first, fallback to user endpoint
    const urls = ['./pri/api/project-market/supervisor', './pri/user/supervisor'];

    const tryNext = (idx: number) => {
      if (idx >= urls.length) {
        this.isLoading = false;
        this.error = 'Nie udało się załadować listy opiekunów';
        this.supervisors = [];
        return;
      }

      this.http.get(urls[idx], { headers: headers }).subscribe({
        next: (resp: any) => {
          if (Array.isArray(resp)) this.supervisors = resp;
          else if (resp && resp.content && Array.isArray(resp.content)) this.supervisors = resp.content;
          else this.supervisors = [];
          this.isLoading = false;
        },
        error: () => tryNext(idx + 1)
      });
    };

    tryNext(0);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    this.dialogRef.close(this.selectedSupervisorId);
  }
}
