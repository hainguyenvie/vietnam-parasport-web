import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const internalUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001/api/v1';
    const targetUrl = `${internalUrl}/posts/bulk-delete`;

    const body = await req.json();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.get("authorization") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`Error proxying POST /posts/bulk-delete:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
