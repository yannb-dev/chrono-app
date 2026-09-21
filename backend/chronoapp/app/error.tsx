"use client";

export default function Error({
  error,
  reset,
}: {
  error: React.ReactNode;
  reset: () => void;
}) {
  console.error("Erreur de login", error);
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center font-mono">
      <p>Impossible de charger la page de connexion.</p>
      <button className="p-2 rounded-sm bg-green-500 mt-10" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
