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
        <div>
          <p>Oups une erreur est survenue</p>
        </div>
      );
    }
  };

  if (messageConfirmValid) {
    return (
      <div>
        <p>Mot de passe changé !</p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register("password")} placeholder="Nouveau mot de passe" />
        {errors.password && <p>{errors.password.message}</p>}
        <input
          {...register("confirmPassword")}
          placeholder="Confirmer nouveau mot de passe"
        />
        {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
        <button type="submit">Valider</button>
      </form>
    </div>
  );
}
