"use client";

import { useState } from "react";

// O app é composto sobre a foto num editor externo; aqui só exibimos a imagem
// final (já com o app na tela) de public/hero-phone.png.
export function HeroMockup() {
  const [semImagem, setSemImagem] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-[400px] lg:mr-0 lg:ml-auto">
      {!semImagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/hero-phone.png"
          alt="Pessoa usando o Kronos no celular"
          className="w-full select-none rounded-[2rem] object-cover shadow-2xl"
          draggable={false}
          onError={() => setSemImagem(true)}
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-100 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Coloque a foto em <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">public/hero-phone.png</code>
          </p>
        </div>
      )}
    </div>
  );
}
