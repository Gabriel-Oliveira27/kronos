import { type NextRequest } from "next/server";
import { Readable } from "node:stream";
import { exigirUsuario } from "@/lib/rbac";
import { obterFotoStream } from "@/lib/drive";
import { comTratamentoDeErro, ApiError } from "@/lib/api";

interface Params {
  params: Promise<{ fileId: string }>;
}

export const GET = comTratamentoDeErro(async (_request: NextRequest, { params }: Params) => {
  await exigirUsuario();
  const { fileId } = await params;

  try {
    const { mimeType, stream } = await obterFotoStream(fileId);
    const streamWeb = Readable.toWeb(stream as Readable) as ReadableStream;

    return new Response(streamWeb, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    throw ApiError.naoEncontrado("Foto não encontrada.");
  }
});
