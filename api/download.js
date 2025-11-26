export default async function handler(req, res) {
  try {
    const url = req.query.url;
    const name = req.query.name || "file.mp4";

    if (!url) return res.status(400).json({ ok: false, msg: "Missing URL" });

    const upstream = await fetch(url);

    if (!upstream.ok) {
      return res.status(500).json({ ok: false, msg: "Failed to fetch file" });
    }

    // Header download
    res.setHeader("Content-Type", upstream.headers.get("Content-Type") || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    res.setHeader("Cache-Control", "no-store");

    // Streaming
    upstream.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Proxy failed" });
  }
}
