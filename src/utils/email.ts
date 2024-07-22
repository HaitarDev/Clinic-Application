import { text } from "express";
import nodemailer from "nodemailer";

export const sentEmail = async (options: {
  email: string;
  subject: string;
  message: string;
}) => {
  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "0e74b503a5ff89",
      pass: "3426179a455fd0",
    },
  });

  const mailOptions = {
    from: "Haitar Abdelmoghith <sadm3979@mail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transport.sendMail(mailOptions);
};
