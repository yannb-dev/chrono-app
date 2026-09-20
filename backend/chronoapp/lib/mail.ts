// lib/mail.ts
import { Resend } from "resend";

const resend = new Resend("re_GnpVyWxy_MrMf3gKmgWYcbS2xTw7uQZJh");

export async function sendVerificationEmail(toEmail: string, token: string) {
  const verifyUrl = `${process.env.APP_URL}/passwordreset?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: toEmail,
    subject: "Confirme ton adresse email",
    html: `
      <p>Bonjour,</p>
      <p>Clique sur le lien ci-dessous pour confirmer ton compte :</p>
      <a href="${verifyUrl}">Confirmer mon email</a>
      <p>Ce lien expire dans 1h.</p>
    `,
  });

  if (error) {
    throw new Error("Échec de l'envoi de l'email : " + error.message);
  }

  return data;
}
