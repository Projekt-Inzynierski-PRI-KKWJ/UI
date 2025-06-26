import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ExternalLinkHistory } from '../../models/external-link-history.model';
import { ExternalLinkService } from '../../services/external-link.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'external-link-history',
  templateUrl: './external-link-history.component.html',
  styleUrls: ['./external-link-history.component.scss']
})
export class ExternalLinkHistoryComponent implements OnInit, OnDestroy {
  @Input() externalLinkId!: string;
  @Input() externalLinkName!: string;
  
  historyDataSource = new MatTableDataSource<ExternalLinkHistory>();
  displayedColumns: string[] = ['changeDate', 'changeType', 'changedBy', 'description'];
  loading = false;
  unsubscribe$ = new Subject<void>();

  constructor(private externalLinkService: ExternalLinkService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadHistory(): void {
    if (!this.externalLinkId) return;
    
    this.loading = true;
    this.externalLinkService.getExternalLinkHistory(this.externalLinkId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (history) => {
          this.historyDataSource.data = history;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading external link history:', error);
          this.loading = false;
        }
      });
  }

  getChangeTypeIcon(changeType: string): string {
    switch (changeType) {
      case 'URL_UPDATED': return 'link';
      case 'FILE_UPLOADED': return 'upload_file';
      case 'FILE_REPLACED': return 'published_with_changes';
      case 'FILE_DELETED': return 'delete';
      case 'LINK_CREATED': return 'add_link';
      case 'LINK_TYPE_CHANGED': return 'swap_horiz';
      default: return 'history';
    }
  }

  getChangeTypeColor(changeType: string): string {
    switch (changeType) {
      case 'URL_UPDATED': return 'primary';
      case 'FILE_UPLOADED': return 'accent';
      case 'FILE_REPLACED': return 'warn';
      case 'FILE_DELETED': return 'warn';
      case 'LINK_CREATED': return 'primary';
      case 'LINK_TYPE_CHANGED': return 'accent';
      default: return '';
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatChangeType(changeType: string): string {
    switch (changeType) {
      case 'URL_UPDATED': return 'URL Updated';
      case 'FILE_UPLOADED': return 'File Uploaded';
      case 'FILE_REPLACED': return 'File Replaced';
      case 'FILE_DELETED': return 'File Deleted';
      case 'LINK_CREATED': return 'Link Created';
      case 'LINK_TYPE_CHANGED': return 'Type Changed';
      default: return changeType;
    }
  }
}
