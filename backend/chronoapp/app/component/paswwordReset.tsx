"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import FormResetPassword from "../component/formResetPassword";
import Image from "next/image";

const noopSubscribe = () => () => {};

function readTokenFromHash(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.hash.slice(1)).get("token");
}

export default function PasswordReset() {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const [token] = useState<string | null>(readTokenFromHash);

  useEffect(() => {
    if (token) history.replaceState(null, "", window.location.pathname);
  }, [token]);

  if (!isClient) return null;

  if (!token)
    return (
      <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
        <Image
          src="/images/android-icon-foreground.png"
          alt="Logo de l'application"
          width={180}
          height={180}
        />
        <div className="h-30 w-[50%] flex justify-center items-center border border-green-400 bg-gray-100 rounded-sm mt-20">
          <h1 className="text-gray-900 text-sm">
            Lien invalide, veuillez relancer une demande de réinitialisation de
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
