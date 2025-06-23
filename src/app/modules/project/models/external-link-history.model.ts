export interface ExternalLinkHistory {
    id: string;
    externalLinkId: string;
    externalLinkName: string;
    previousUrl?: string;
    previousLinkType?: 'EXTERNAL' | 'INTERNAL';
    previousOriginalFileName?: string;
    previousContentType?: string;
    previousFileSize?: number;
    changedByUserName: string;
    changedByUserIndexNumber: string;
    changeType: 'URL_UPDATED' | 'FILE_UPLOADED' | 'FILE_REPLACED' | 'FILE_DELETED' | 'LINK_CREATED' | 'LINK_TYPE_CHANGED';
    changeDescription: string;
    changeDate: string;
    creationDate: string;
    modificationDate: string;
}
