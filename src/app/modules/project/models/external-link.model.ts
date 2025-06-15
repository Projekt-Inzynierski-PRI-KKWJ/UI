export interface ExternalLink {
    id: string
    url: string;
    name: string;
    columnHeader: string;
    deadline: string;
    // File-related fields
    contentType?: string;
    linkType?: 'EXTERNAL' | 'INTERNAL';
    originalFileName?: string;
    fileSize?: number;
    // Date fields
    creationDate?: string;
    modificationDate?: string;
}