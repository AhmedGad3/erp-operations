import * as nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    throw new Error('Missing EMAIL or PASSWORD env vars');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendEmail(SendMailOptions: nodemailer.SendMailOptions) {
  const transport = getTransporter();
  return transport.sendMail(SendMailOptions);
}
