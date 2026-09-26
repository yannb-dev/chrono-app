import { useEffect, useState } from "react";
import FormResetPassword from "./component/formResetPassword";
import Image from "next/image";

type token = string | null;

export default async function passwordReset() {
  const [token, setToken] = useState<token>();

  useEffect(() => {
    const hash = window.location.hash;
    setToken(new URLSearchParams(hash.slice(1)).get("token"));

    if (token) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (!token)
    return (
      <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
        <Image
          src="/images/android-icon-foreground.png"
          alt="Logo de l'application"
          width={200}
          height={200}
        />
        <div className="h-30 w-[50%] flex justify-center items-center bg-gray-400 rounded-sm mt-20">
          <h1 className="text-gray-900 text-sm">
            Lien invalide, veuiller relancer une demande de réinitialisation de
            mot de passe
          </h1>
        </div>
      </div>
    );

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
      <Image
        src="/images/android-icon-foreground.png"
        alt="Logo de l'application"
        width={200}
        height={200}
      />

      <FormResetPassword token={token} />
    </div>
  );
}
