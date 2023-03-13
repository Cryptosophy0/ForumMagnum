import { DatabaseServerSetting } from '../databaseSettings';
import type { RenderedEmail } from './renderEmail';
import nodemailer from 'nodemailer';

// export const mailUrlSetting = new DatabaseServerSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

// const getMailUrl = () => {
//   if (mailUrlSetting.get())
//     return mailUrlSetting.get();
//   else if (process.env.MAIL_URL)
//     return process.env.MAIL_URL;
//   else
//     return null;
// };

export const smtpUserSetting = new DatabaseServerSetting<string | null>('mail.smtpUser', null) 
export const smtpPassSetting = new DatabaseServerSetting<string | null>('mail.smtpPass', null) 

/**
 * Send an email. Returns true for success or false for failure.
 *
 * API descended from meteor
 */
export const sendEmailSmtp = async (email: RenderedEmail): Promise<boolean> => {
  const smtpUser = smtpUserSetting.get();
  const smtpPass = smtpPassSetting.get();
  
  if (!smtpUser || !smtpPass) {
    // eslint-disable-next-line no-console
    console.log("Unable to send email because smtp user or smtp pass are not configured");
    return false;
  }
  
  // const transport = nodemailer.createTransport(mailUrl);

  const transport = nodemailer.createTransport({
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    }
  });
  
  const result = await transport.sendMail({
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  
  return true;
}
