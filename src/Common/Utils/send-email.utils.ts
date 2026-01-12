import * as nodemailer from 'nodemailer';

export async function sendEmail(SendMailOptions: nodemailer.SendMailOptions) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  return await transporter.sendMail(SendMailOptions);
}
