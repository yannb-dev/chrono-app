"use client";

import { useState, useEffect } from "react";
import FormResetPassword from "./component/formResetPassword";
import Image from "next/image";

type token = string | null;

export default function PasswordReset() {
  const [token, setToken] = useState<token>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const found = new URLSearchParams(hash.slice(1)).get("token");

    setToken(found);
    setReady(true);

    if (found) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (!ready) return null;

  if (!token)
    return (
      <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
        <Image
          src="/images/android-icon-foreground.png"
          alt="Logo de l'application"
          width={180}
          height={1800}
        />
        <div className="h-30 w-[50%] flex justify-center items-center bg-gray-300 rounded-sm mt-20">
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
        width={180}
        height={180}
      />

      <FormResetPassword token={token} />
    </div>
  );
}
