"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewPasswordSchema } from "@/lib/schema/newPasswordSchema";
import { useState } from "react";

export default function FormResetPassword({ token }: { token: string }) {
  const [messageConfirmValid, setMessageConfirmValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(NewPasswordSchema),
  });

  const onSubmit = async (value: NewPasswordSchema) => {
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
        setMessageConfirmValid(true);
      }
    } catch (error) {
      console.error("Erreur du fetch passwordReset", error);
      return (
        <div className="h-[40%] w-200 flex justify-center items-center p-10 rounded-4 bg-gray-400">
          <p>Oups une erreur est survenue</p>
        </div>
      );
    }
  };

  if (messageConfirmValid) {
    return (
      <div className="h-[40%] w-200 flex justify-center items-center p-10 rounded-4 bg-gray-400">
        <p>Mot de passe changé !</p>
      </div>
    );
  }

  return (
    <div className="h-[40%] w-150 flex flex-col justify-center items-center rounded-4 bg-gray-300">
      <h1 className="text-gray-900 text-sm mt-20 mb-20">
        Veuillez choisir un nouveau mot de passe
      </h1>
      <form className="flex flex-col " onSubmit={handleSubmit(onSubmit)}>
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
          className="w-60 p-4 rounded-sm bg-green-500 mt-16"
          type="submit"
        >
          Valider
        </button>
      </form>
    </div>
  );
}
