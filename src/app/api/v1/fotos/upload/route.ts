import { NextResponse, type NextRequest } from "next/server";
import { exigirUsuario } from "@/lib/rbac";
import { enviarFotoCloudinary, UploadFotoError } from "@/lib/cloudinary";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File)) {
    throw new ApiError(400, "Envie o arquivo no campo 'arquivo'.", "ARQUIVO_AUSENTE");
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());

  try {
    const { publicId, url } = await enviarFotoCloudinary(
      buffer,
      arquivo.type,
      usuario.id
    );

    // Retorna a URL pública do Cloudinary — o front-end salva via PATCH /usuarios/me
    return NextResponse.json({ driveFileId: publicId, url }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadFotoError) {
      throw new ApiError(400, err.message, "UPLOAD_INVALIDO");
    }
    await registrarEvento({
      tipo: "UPLOAD_FOTO_FALHA",
      usuarioId: usuario.id,
      detalhe: { mensagem: err instanceof Error ? err.message : String(err) },
    });
    throw new ApiError(502, "Não foi possível enviar a foto ao Cloudinary.", "CLOUDINARY_INDISPONIVEL");
  }
});
