// lib/mail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_TOKEN);

export async function sendVerificationEmail(toEmail: string, token: string) {
  const verifyUrl = `${process.env.APP_URL}/?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev", // ajouter un nom de domaine pour la prod
    to: toEmail,
    subject: "Réinitialisation de mot de passe",
    html: `
    <div style="max-width: 480px; margin: 0 auto; padding: 24px; text-align: center; font-family: Arial, sans-serif;">
      <p>Bonjour, vous souhaitez réinitialiser votre mot de passe ChronoAPP</p>
      <p>Cliquez sur le lien ci-dessous pour lancer la procédure :</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; border-radius: 3px; background-color: gray; color: black; text-decoration: none;">
    Réinitialiser
      </a>
    <p>Ce lien expire dans 30min.</p>
    </div>
    `,
  });
  console.log(data, error, "mail.ts");

  if (error) {
    throw new Error("Échec de l'envoi de l'email : " + error.message);
  }

  return data;
}
