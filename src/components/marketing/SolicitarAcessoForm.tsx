"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Erros {
  nomeCompleto?: string;
  setor?: string;
  email?: string;
  observacoes?: string;
  geral?: string;
}

export function SolicitarAcessoForm() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erros, setErros] = useState<Erros>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErros({});
    setEnviando(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      nomeCompleto: String(form.get("nomeCompleto") ?? ""),
      setor: String(form.get("setor") ?? ""),
      email: String(form.get("email") ?? ""),
      observacoes: String(form.get("observacoes") ?? ""),
    };

    try {
      const res = await fetch("/api/v1/solicitacoes-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.detalhes) {
          const novosErros: Erros = {};
          for (const issue of data.detalhes) {
            const campo = issue.path?.[0];
            if (campo) novosErros[campo as keyof Erros] = issue.message;
          }
          setErros(novosErros);
        } else {
          setErros({ geral: data?.error ?? "Não foi possível enviar sua solicitação." });
        }
        return;
      }

      setEnviado(true);
    } catch {
      setErros({ geral: "Não foi possível conectar ao servidor. Tente novamente." });
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-500/30 dark:bg-green-500/10">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Solicitação enviada
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Um administrador vai analisar seu pedido e criar seu acesso. Você será avisado(a) por
          fora do Kronos quando estiver liberado.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input name="nomeCompleto" label="Nome completo *" placeholder="Maria Silva" error={erros.nomeCompleto} required />
      <Input name="setor" label="Setor *" placeholder="Vendas, Operações, TI..." error={erros.setor} required />
      <Input name="email" type="email" label="E-mail (opcional)" placeholder="voce@empresa.com" error={erros.email} />
      <Textarea
        name="observacoes"
        label="Observações (opcional)"
        placeholder="Algo que ajude o admin a entender seu pedido"
        error={erros.observacoes}
      />
      {erros.geral && <p className="text-sm text-danger">{erros.geral}</p>}
      <Button type="submit" loading={enviando} className="mt-2">
        Enviar solicitação
      </Button>
    </form>
  );
}
