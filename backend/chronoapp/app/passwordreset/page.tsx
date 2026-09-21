import FormResetPassword from "../component/formResetPassword";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function passwordReset({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token)
    return (
      <div>
        <h1>
          Lien invalide, veuiller relancer une demande de réinitialisation de
          mot de passe
        </h1>
      </div>
    );

  return (
    <div className="h-[100vh] w-[100%] bg-gradient-to-r from-zinc-200 to-orange-200 p-12 flex justify-content align-Item">
      <h1>Veuillez choisir un nouveau mot de passe</h1>
      <FormResetPassword token={token} />
    </div>
  );
}
