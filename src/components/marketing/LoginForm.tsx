"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm({ redirectPara }: { redirectPara: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          senha: String(form.get("senha") ?? ""),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErro(data?.error ?? "Não foi possível entrar.");
        return;
      }

      router.push(redirectPara);
      router.refresh();
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input name="username" label="Usuário" placeholder="seu.usuario" autoComplete="username" required />
      <Input name="senha" type="password" label="Senha" autoComplete="current-password" required />
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <Button type="submit" loading={enviando} className="mt-2">
        Entrar
      </Button>
    </form>
  );
}
