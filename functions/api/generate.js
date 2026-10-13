const json = (data, status, origin) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(origin ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    } : {})
  }
});

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = env.APP_ORIGIN || "https://gmaker505-a11y.github.io";
  if (origin !== allowedOrigin) return json({ error: "Origin not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    }
  });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405, origin);
  if (!env.OPENAI_API_KEY || !env.PANELFORGE_ACCESS_CODE) {
    return json({ error: "Server setup is incomplete. Configure OPENAI_API_KEY and PANELFORGE_ACCESS_CODE as server-side secrets." }, 503, origin);
  }

  let input;
  try {
    const raw = await request.text();
    if (raw.length > 18_000_000) return json({ error: "Request is too large. Use smaller reference images." }, 413, origin);
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400, origin);
  }
  if (typeof input.accessCode !== "string" || input.accessCode.length > 200 || input.accessCode !== env.PANELFORGE_ACCESS_CODE) {
    return json({ error: "Access code is incorrect." }, 401, origin);
  }
  const prompt = String(input.prompt || "").trim();
  if (!prompt || prompt.length > 12000) return json({ error: "Prompt must be between 1 and 12,000 characters." }, 400, origin);
  const sizes = new Set(["1024x1024", "1536x1024", "1024x1536"]);
  const qualities = new Set(["low", "medium", "high"]);
  const size = sizes.has(input.size) ? input.size : "1024x1024";
  const quality = qualities.has(input.quality) ? input.quality : "medium";
  const model = env.IMAGE_MODEL || "gpt-image-1";

  try {
    const refs = Array.isArray(input.referenceImages) ? input.referenceImages.slice(0, 5) : [];
    let upstream;
    if (refs.length) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", prompt);
      form.append("size", size);
      form.append("quality", quality);
      form.append("output_format", "png");
      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        if (!ref || typeof ref.dataUrl !== "string" || !ref.dataUrl.startsWith("data:image/")) continue;
        const comma = ref.dataUrl.indexOf(",");
        if (comma < 0) continue;
        const meta = ref.dataUrl.slice(0, comma);
        const mime = (meta.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/) || [])[1];
        if (!mime) continue;
        const binary = atob(ref.dataUrl.slice(comma + 1));
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
        const ext = mime.split("/")[1].replace("jpeg", "jpg");
        const filename = String(ref.name || ("reference-" + (i + 1) + "." + ext)).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
        form.append("image[]", new Blob([bytes], { type: mime }), filename);
      }
      upstream = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.OPENAI_API_KEY },
        body: form
      });
    } else {
      upstream = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.OPENAI_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, size, quality, output_format: "png", n: 1 })
      });
    }
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = result?.error?.message || ("Image provider returned HTTP " + upstream.status + ".");
      return json({ error: message }, upstream.status >= 500 ? 502 : 400, origin);
    }
    const image = result?.data?.[0]?.b64_json;
    if (!image) return json({ error: "Image provider returned no base64 image data." }, 502, origin);
    return json({ imageDataUrl: "data:image/png;base64," + image, model }, 200, origin);
  } catch (error) {
    return json({ error: error?.message || "Image generation request failed." }, 502, origin);
  }
}
