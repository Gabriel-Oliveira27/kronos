"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar() {
    setCarregando(true); setErro(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error ?? "Não foi possível fazer login."); return; }
      router.push("/dashboard");
    } catch { setErro("Não foi possível conectar ao servidor."); }
    finally { setCarregando(false); }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1220] px-6 py-12">
      {/* Botão Home */}
      <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors self-start sm:self-auto">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Página inicial
      </Link>

      <Link href="/" className="mb-8"><Logo /></Link>

      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="font-display text-xl font-semibold text-white">Entrar no Kronos</h1>
        <p className="mt-1 text-sm text-slate-400">Informe suas credenciais de acesso.</p>
        <div className="mt-6 flex flex-col gap-4">
          <Input label="Usuário" placeholder="seu.usuario" value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && entrar()} />
          <PasswordInput label="Senha" placeholder="••••••••" value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === "Enter" && entrar()} error={erro ?? undefined} />
          <Button onClick={entrar} loading={carregando} disabled={!username || !senha}>
            Entrar
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link href="/solicitar-acesso" className="font-medium text-brand-blue hover:underline">Solicitar acesso</Link>
        </p>
      </div>
    </div>
  );
}
