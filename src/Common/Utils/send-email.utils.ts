import * as nodemailer from 'nodemailer';

export async function sendEmail(SendMailOptions: nodemailer.SendMailOptions) {
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    throw new Error('Missing EMAIL or PASSWORD env vars');
  }

  const transporter = nodemailer.createTransport({
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

  await transporter.verify();
  return await transporter.sendMail(SendMailOptions);
}
