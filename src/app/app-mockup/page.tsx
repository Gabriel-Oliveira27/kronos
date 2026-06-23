import { AppScreen } from "@/components/marketing/AppScreen";

// Página utilitária: renderiza SOMENTE a tela do app, em tela cheia, para
// exportar como imagem (screenshot) e compor sobre a foto do hero num editor.
// Acesse /app-mockup e capture a área da tela.
export default function AppMockupPage() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-[#0B1220] p-0">
      <div className="w-[380px]">
        <AppScreen />
      </div>
    </div>
  );
}
