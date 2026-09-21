"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewPasswordSchema } from "@/lib/schema/newPasswordSchema";
import { useState } from "react";
import Image from "next/image";

export default function FormResetPassword({ token }: { token: string }) {
  const [messageConfirmValid, setMessageConfirmValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(NewPasswordSchema),
  });

  const onSubmit = async (value: NewPasswordSchema) => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/passwordresettoken", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          newPassword: value.password,
        }),
      });

      const data = await response.json();

      if (data.status === 200) {
        setLoading(false);
        setMessageConfirmValid(true);
      }
    } catch (error) {
      setLoading(false);
      console.error("Erreur du fetch passwordReset", error);
      return (
        <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
          <div className="h-30 w-120 flex justify-center items-center p-10 rounded-4 bg-gray-400">
            <p>Oups une erreur est survenue</p>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    <div className="h-100 w-100 relative flex items-center justify-center">
      <Image
        src="/images/android-icon-foreground.png"
        alt="Logo de l'application"
        width={70}
        height={70}
      />
      <div className="h-50 w-50 absolute top-0 left-0 flex items-start justify-center animate-spin">
        <div className="h-4 w-4 rounded-[50%] bg-gray-300"></div>
      </div>
    </div>;
  }

  if (messageConfirmValid) {
    return (
      <div className="h-[40%] w-200 flex justify-center items-center p-10 rounded-4 bg-gray-400">
        <p>Mot de passe changé !</p>
      </div>
    );
  }

  return (
    <div className="h-[40%] w-150 flex flex-col justify-center items-center rounded-xl bg-gray-300">
      <h1 className="text-gray-900 text-sm mt-12 mb-12">
        Veuillez choisir un nouveau mot de passe.
      </h1>
      <form
        className="flex flex-col items-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input
          className="w-100 border-b border-gray-100 mb-4 outline-none focus:ring-gray-300 focus:ring-1 text-gray-900"
          {...register("password")}
          placeholder="Nouveau mot de passe"
          type="password"
        />
        {errors.password && <p>{errors.password.message}</p>}
        <input
          className="w-100 border-b border-gray-100 outline-none focus:ring-gray-300 focus:ring-1 text-gray-900"
          {...register("confirmPassword")}
          placeholder="Confirmer nouveau mot de passe"
          type="password"
        />
        {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
        <button
          className="w-60 p-2 rounded-sm bg-green-500 mt-10"
          type="submit"
        >
          Valider
        </button>
      </form>
    </div>
  );
}
