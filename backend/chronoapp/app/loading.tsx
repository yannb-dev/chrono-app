"use client";
import Image from "next/image";

export default function LoadingAnim() {
  return (
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
    </div>
  );
}
