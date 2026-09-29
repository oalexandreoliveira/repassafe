"use client";
import Image from "next/image";
import { useState } from "react";
export function ProfilePhoto({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p role="status">
      Não foi possível carregar a foto. Recarregue a página ou substitua o
      arquivo abaixo.
    </p>
  ) : (
    <Image
      src={src}
      alt="Sua foto profissional atual"
      width={128}
      height={128}
      className="profile-photo"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
