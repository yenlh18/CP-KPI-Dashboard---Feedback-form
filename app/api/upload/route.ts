import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(req: NextRequest) {
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/png", "image/jpeg"],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Upload token generation failed:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
