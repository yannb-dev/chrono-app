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
    <div className="h-[40%] w-300 flex justify-center items-center p-10 rounded-4 bg-gray-300">
      <form className="flex flex-col " onSubmit={handleSubmit(onSubmit)}>
        <input
          className="w-60 border-b border-gray-100 mb-4 outline-none focus:ring-gray-100 focus:ring-1"
          {...register("password")}
          placeholder="Nouveau mot de passe"
        />
        {errors.password && <p>{errors.password.message}</p>}
        <input
          className="w-60 border-b border-gray-100 mb-20 outline-none focus:ring-gray-100 focus:ring-1"
          {...register("confirmPassword")}
          placeholder="Confirmer nouveau mot de passe"
        />
        {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
        <button className="p-4 rounded-sm bg-green-500" type="submit">
          Valider
        </button>
      </form>
    </div>
  );
}
