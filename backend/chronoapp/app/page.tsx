import FormResetPassword from "./component/formResetPassword";
import Image from "next/image";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function passwordReset({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token)
    return (
      <div className="h-screen w-full flex justify-center items-center font-mono">
        <Image
          src="/images/android-icon-foreground.png"
          alt="Logo de l'application"
          width={120}
          height={120}
        />
        <div className="h-80 w-[50%] flex justify-center items-center bg-gray-900 rounded-sm mt-20">
          <h1 className="text-gray-300 text-sm">
            Lien invalide, veuiller relancer une demande de réinitialisation de
            mot de passe
          </h1>
        </div>
      </div>
    );

  return (
    <div className="h-screen w-full flex justify-center items-center font-mono">
      <Image
        src="/images/android-icon-foreground.png"
        alt="Logo de l'application"
        width={120}
        height={120}
      />
      <h1 className="text-gray-300 text-sm mt-20">
        Veuillez choisir un nouveau mot de passe
      </h1>
      <FormResetPassword token={token} />
    </div>
  );
}
