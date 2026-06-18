import "server-only";
import { google } from "googleapis";
import { Readable } from "node:stream";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error(
      "Credenciais da Service Account do Google não configuradas (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)."
    );
  }

  return new google.auth.JWT({ email, key: privateKey, scopes: SCOPES });
}

export interface FotoEnviada {
  driveFileId: string;
  /** Caminho relativo dentro da própria API — não uma URL do Google. */
  url: string;
}

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB

export class UploadFotoError extends Error {}

/**
 * Sobe uma foto para o Google Drive via Service Account. O arquivo
 * permanece PRIVADO no Drive (sem link público) — só a própria Service
 * Account consegue ler o conteúdo depois. A foto é servida ao navegador via
 * `GET /api/v1/fotos/[fileId]`, que faz o proxy autenticado do conteúdo.
 *
 * Isso evita depender de truques de URL direta do Google (tipo
 * `uc?export=view`) que não são oficialmente suportados e já quebraram
 * várias vezes no passado — e também respeita à risca o requisito do
 * briefing de que o usuário final nunca interage com login do Google.
 */
export async function enviarFotoParaDrive(
  buffer: Buffer,
  nomeArquivo: string,
  mimeType: string
): Promise<FotoEnviada> {
  if (!TIPOS_PERMITIDOS.has(mimeType)) {
    throw new UploadFotoError("Formato de imagem não suportado. Use JPEG, PNG ou WebP.");
  }
  if (buffer.byteLength > TAMANHO_MAXIMO_BYTES) {
    throw new UploadFotoError("Imagem muito grande. O limite é 5MB.");
  }

  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const criado = await drive.files.create({
    requestBody: {
      name: nomeArquivo,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id",
  });

  const fileId = criado.data.id;
  if (!fileId) {
    throw new UploadFotoError("O Google Drive não retornou um ID de arquivo.");
  }

  return {
    driveFileId: fileId,
    url: `/api/v1/fotos/${fileId}`,
  };
}

export interface FotoStream {
  mimeType: string;
  stream: NodeJS.ReadableStream;
}

/**
 * Busca o conteúdo de uma foto já enviada, para a rota de proxy devolver ao
 * navegador. Usada por GET /api/v1/fotos/[fileId].
 */
export async function obterFotoStream(fileId: string): Promise<FotoStream> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const metadados = await drive.files.get({ fileId, fields: "mimeType" });
  const mimeType = metadados.data.mimeType ?? "application/octet-stream";

  const resposta = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return { mimeType, stream: resposta.data };
}
