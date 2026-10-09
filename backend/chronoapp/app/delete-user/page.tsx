"use client";
import FormDeleteUser from "../component/formDeleteUser";
import Image from "next/image";

export default function DeleteUser() {
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
      <Image
        src="/images/android-icon-foreground.png"
        alt="Logo de l'application"
        width={180}
        height={180}
      />

      <FormDeleteUser />
    </div>
  );
}
