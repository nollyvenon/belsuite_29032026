import { Injectable } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

@Injectable()
export class GoogleSheetsService {
  constructor(private readonly gauth: GoogleAuthService) {}

  async createSpreadsheet(organizationId: string, title: string, sheets?: string[]): Promise<string> {
    const body = {
      properties: { title },
      sheets: (sheets ?? ['Sheet1']).map(s => ({ properties: { title: s } })),
    };

    const data = await this.gauth.apiFetch(organizationId, BASE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    return data.spreadsheetId;
  }

  async readRange(
    organizationId: string,
    spreadsheetId:  string,
    range:          string,  // e.g. "Sheet1!A1:D10"
  ): Promise<any[][]> {
    const data = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    );
    return data.values ?? [];
  }

  async writeRange(
    organizationId: string,
    spreadsheetId:  string,
    range:          string,
    values:         any[][],
    inputOption = 'RAW',
  ): Promise<{ updatedRows: number; updatedCells: number }> {
    const data = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=${inputOption}`,
      {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ range, majorDimension: 'ROWS', values }),
      },
    );

    return { updatedRows: data.updatedRows ?? 0, updatedCells: data.updatedCells ?? 0 };
  }

  async appendRows(
    organizationId: string,
    spreadsheetId:  string,
    range:          string,
    rows:           any[][],
  ): Promise<void> {
    await this.gauth.apiFetch(
      organizationId,
      `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ majorDimension: 'ROWS', values: rows }),
      },
    );
  }

  async clearRange(organizationId: string, spreadsheetId: string, range: string): Promise<void> {
    await this.gauth.apiFetch(
      organizationId,
      `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
      { method: 'POST' },
    );
  }

  async getSheetNames(organizationId: string, spreadsheetId: string): Promise<string[]> {
    const data = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/${spreadsheetId}?fields=sheets.properties.title`,
    );
    return (data.sheets ?? []).map((s: any) => s.properties.title);
  }

  /** Export a campaign report to a new spreadsheet */
  async exportReport(
    organizationId: string,
    title:          string,
    headers:        string[],
    rows:           any[][],
  ): Promise<{ spreadsheetId: string; url: string }> {
    const id = await this.createSpreadsheet(organizationId, title);
    await this.writeRange(organizationId, id, 'Sheet1!A1', [headers, ...rows], 'USER_ENTERED');
    return {
      spreadsheetId: id,
      url: `https://docs.google.com/spreadsheets/d/${id}`,
    };
  }
}
