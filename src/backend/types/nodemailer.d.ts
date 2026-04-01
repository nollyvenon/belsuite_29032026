declare module 'nodemailer' {
  export interface Transporter {
    sendMail(options: any): Promise<any>;
    verify(): Promise<void>;
  }

  export function createTransport(config: any): Transporter;
}