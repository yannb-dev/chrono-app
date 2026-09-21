"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewPasswordSchema } from "@/lib/schema/newPasswordSchema";
import { useState } from "react";

import { NetworkError, HttpError, extractErrorMessage } from "@/lib/errors";

export default function FormResetPassword({ token }: { token: string }) {
  const [messageConfirmValid, setMessageConfirmValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [error, setError] = useState(false);

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
      await fetch("/api/auth/passwordresettoken", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          newPassword: value.password,
        }),
      });

      setLoading(false);
      setMessageConfirmValid(true);
    } catch (error) {
      console.error("Erreur du fetch passwordReset", error);
      if (error instanceof HttpError) {
        setDetailError(extractErrorMessage(error.body));
      } else if (error instanceof NetworkError) {
        setDetailError(error.message);
      } else {
        setDetailError("Une erreur inattendue est survenue");
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
        <div className="h-30 w-120 flex justify-center items-center p-10 rounded-4 bg-gray-400">
          <p>Oups une erreur est survenue</p>
          <p>{detailError}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-100 w-100 flex flex-col items-center justify-evenly animate-spin">
        <div className="h-4 w-4 rounded-[50%] bg-gray-900"></div>
        <div className="h-4 w-4 rounded-[50%] bg-gray-900"></div>
      </div>
    );
  }

  if (messageConfirmValid) {
    return (
      <div className="h-[40%] w-40 flex justify-center items-center p-10 rounded-sm bg-gray-400">
        <p>Mot de passe changé !</p>
        <p className="mt-4">
          Vous pouvez fermer cet onglet et vous connecter sur votre application
        </p>
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
          className="w-60 p-2 rounded-sm bg-green-500 mt-10 hover:"
          type="submit"
        >
          Valider
        </button>
      </form>
    </div>
  );
}
