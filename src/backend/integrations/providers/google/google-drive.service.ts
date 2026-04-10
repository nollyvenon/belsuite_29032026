import { Injectable } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { GoogleDriveFile } from '../../types/integration.types';

const BASE  = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

@Injectable()
export class GoogleDriveService {
  constructor(private readonly gauth: GoogleAuthService) {}

  async listFiles(
    organizationId: string,
    options?: { query?: string; folderId?: string; maxResults?: number; mimeType?: string },
  ): Promise<GoogleDriveFile[]> {
    const parts: string[] = ['trashed = false'];
    if (options?.folderId) parts.push(`'${options.folderId}' in parents`);
    if (options?.mimeType) parts.push(`mimeType = '${options.mimeType}'`);
    if (options?.query)    parts.push(`name contains '${options.query}'`);

    const params = new URLSearchParams({
      q:          parts.join(' and '),
      pageSize:   String(options?.maxResults ?? 30),
      fields:     'files(id,name,mimeType,size,webViewLink,modifiedTime)',
      orderBy:    'modifiedTime desc',
    });

    const data = await this.gauth.apiFetch(organizationId, `${BASE}/files?${params}`);
    return (data.files ?? []).map(this.parseFile);
  }

  async getFile(organizationId: string, fileId: string): Promise<GoogleDriveFile> {
    const data = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/files/${fileId}?fields=id,name,mimeType,size,webViewLink,modifiedTime`,
    );
    return this.parseFile(data);
  }

  async uploadFile(
    organizationId: string,
    name:      string,
    content:   Buffer | string,
    mimeType:  string,
    folderId?: string,
  ): Promise<GoogleDriveFile> {
    const metadata: any = { name };
    if (folderId) metadata.parents = [folderId];

    const boundary   = '-------314159265358979323846';
    const delimiter  = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const body = [
      delimiter,
      'Content-Type: application/json\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${mimeType}\r\n\r\n`,
      typeof content === 'string' ? content : content.toString('base64'),
      closeDelim,
    ].join('');

    const data = await this.gauth.apiFetch(
      organizationId,
      `${UPLOAD}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink`,
      {
        method:  'POST',
        headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
        body,
      },
    );

    return this.parseFile(data);
  }

  async createFolder(organizationId: string, name: string, parentId?: string): Promise<string> {
    const body: any = { name, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) body.parents = [parentId];

    const data = await this.gauth.apiFetch(organizationId, `${BASE}/files`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return data.id;
  }

  async deleteFile(organizationId: string, fileId: string): Promise<void> {
    await this.gauth.apiFetch(organizationId, `${BASE}/files/${fileId}`, { method: 'DELETE' });
  }

  async shareFile(organizationId: string, fileId: string, email: string, role: 'reader' | 'writer' = 'reader'): Promise<void> {
    await this.gauth.apiFetch(
      organizationId,
      `${BASE}/files/${fileId}/permissions`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'user', role, emailAddress: email }),
      },
    );
  }

  private parseFile = (data: any): GoogleDriveFile => ({
    id:           data.id,
    name:         data.name,
    mimeType:     data.mimeType,
    size:         data.size ? Number(data.size) : undefined,
    webViewLink:  data.webViewLink,
    modifiedTime: data.modifiedTime ? new Date(data.modifiedTime) : undefined,
  });
}
