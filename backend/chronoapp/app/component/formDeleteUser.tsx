"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeleteUserSchema } from "@/lib/schema/deleteUserSchema";
import { useState } from "react";

import { NetworkError, HttpError, extractErrorMessage } from "@/lib/errors";

import { IoIosWarning } from "react-icons/io";

export default function FormDeleteUser() {
  const [messageConfirmValid, setMessageConfirmValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [error, setError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(DeleteUserSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (value: DeleteUserSchema) => {
    setLoading(true);

    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new HttpError(response.status, body);
      }
      setLoading(false);
      setMessageConfirmValid(true);
    } catch (error) {
      console.error("Erreur du fetch user", error);
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
        <div className="h-30 w-200 flex flex-col justify-center items-center p-10 rounded-xl border border-green-400 bg-gray-100">
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
      <div className="h-100 w-200 flex flex-col justify-center items-center p-10 rounded-xl border border-green-400 bg-gray-100">
        <p>Votre compte a été supprimé.</p>
        <p className="mt-4">Vous pouvez fermer cet onglet.</p>
      </div>
    );
  }

  return (
    <div className="h-[50%] w-150 p-8 flex flex-col justify-center items-center font-mono rounded-xl border border-green-400 bg-gray-100">
      <div className="m-4 p-2 bg-red-200 rounded-md border border-white">
        <h1 className="text-gray-800 text-sm">
          Vous êtes sur le point de supprimer votre compte. Cette action est
          irréversible.
        </h1>
      </div>

      <div>
        <IoIosWarning className="text-4xl text-red-500 " />
      </div>
      <h1 className="text-gray-900 text-sm mt-12 mb-12">
        Veuillez saisie votre email et votre mot de passe.
      </h1>
      <form
        className="flex flex-col items-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input
          className="w-100 border-b border-gray-200 mb-4 outline-none   text-gray-900"
          {...register("email")}
          placeholder="Email"
        />
        {errors.email?.message && <p>{errors.email.message}</p>}
        <input
          className="w-100 border-b border-gray-200 outline-none text-gray-900"
          {...register("password")}
          placeholder="Mot de passe"
          type="password"
        />
        {errors.password?.message && <p>{errors.password.message}</p>}
        <button
          className="w-60 p-2 rounded-sm bg-green-500 mt-10 hover:bg-white hover:border-2 hover:border-green-500 "
          type="submit"
        >
          Supprimer
        </button>
      </form>
    </div>
  );
}
