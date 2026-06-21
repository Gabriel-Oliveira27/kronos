import "server-only";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary substitui o Google Drive para armazenamento de fotos.
// Vantagens: tier gratuito generoso (25 GB), URL pública direta (sem proxy),
// transformações de imagem automáticas e sem necessidade de Service Account.
//
// Configurar no .env:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

function configurar() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Credenciais do Cloudinary não configuradas. " +
        "Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

export interface FotoEnviada {
  /** ID público do Cloudinary — usado para deleção futura se necessário. */
  publicId: string;
  /** URL pública HTTPS da imagem, pronta para uso direto no <img> ou next/image. */
  url: string;
}

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

export class UploadFotoError extends Error {}

/**
 * Envia uma foto de perfil ao Cloudinary.
 *
 * Diferente do Google Drive, o Cloudinary devolve uma URL pública que pode
 * ser usada diretamente no front-end — não é necessário um proxy autenticado.
 * O campo `Usuario.fotoUrl` passa a armazenar essa URL completa.
 *
 * Transformações aplicadas no upload:
 *  - Recorte 400×400 centrado no rosto (gravity: face)
 *  - Compressão automática e formato otimizado (WebP quando suportado)
 */
export async function enviarFotoCloudinary(
  buffer: Buffer,
  mimeType: string,
  usuarioId: string
): Promise<FotoEnviada> {
  if (!TIPOS_PERMITIDOS.has(mimeType)) {
    throw new UploadFotoError("Formato não suportado. Use JPEG, PNG ou WebP.");
  }
  if (buffer.byteLength > TAMANHO_MAXIMO_BYTES) {
    throw new UploadFotoError("Imagem muito grande. O limite é 5 MB.");
  }

  configurar();

  // Converte Buffer para data URI (formato aceito pelo SDK do Cloudinary)
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "kronos/fotos",
    public_id: `usuario_${usuarioId}_${Date.now()}`,
    resource_type: "image",
    overwrite: true,
    transformation: [
      // Recorta centralizado no rosto, 400×400px
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      // Compressão automática e formato otimizado pelo Cloudinary
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
  };
}
