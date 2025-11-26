export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ ok: false, msg: "No URL provided" });

    const lower = url.toLowerCase();
    let platform = "unknown";

    if (lower.includes("tiktok.com")) platform = "tiktok";
    else if (lower.includes("instagram.com")) platform = "instagram";
    else if (lower.includes("facebook.com") || lower.includes("fb.watch")) platform = "facebook";
    else if (lower.includes("youtube.com") || lower.includes("youtu.be")) platform = "youtube";

    /* ==============================
       TIKTOK (TikWM API)
    ===============================*/
    if (platform === "tiktok") {
      const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const r = await fetch(api);
      const j = await r.json();

      if (!j?.data) return res.json({ ok: false });

      return res.json({
        ok: true,
        data: {
          platform: "tiktok",
          title: j.data.title,
          thumbnail: j.data.cover,
          formats: [
            { id: "no_wm", label: "No Watermark", url: j.data.play },
            { id: "wm", label: "Watermark", url: j.data.wmplay },
            { id: "music", label: "Audio Only", url: j.data.music }
          ]
        }
      });
    }

    /* ==============================
       INSTAGRAM (SnapInsta API)
    ===============================*/
    if (platform === "instagram") {
      const r = await fetch("https://snapinsta.app/action.php", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `url=${encodeURIComponent(url)}&action=post`
      });

      const html = await r.text();
      const match = html.match(/(https?:\/\/[^"]+\.mp4[^"]*)/);

      if (!match) return res.json({ ok: false });

      return res.json({
        ok: true,
        data: {
          platform: "instagram",
          title: "Instagram Video",
          thumbnail: null,
          formats: [
            { id: "hd", label: "HD", url: match[1] }
          ]
        }
      });
    }

    /* ==============================
       FACEBOOK (SnapSave)
    ===============================*/
    if (platform === "facebook") {
      const r = await fetch("https://snapsave.app/api/ajaxSearch", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: `q=${encodeURIComponent(url)}`
      });

      const j = await r.json();
      if (!j?.data) return res.json({ ok: false });

      const f = [];

      if (j.data[0]?.url) f.push({ id: "hd", label: "HD", url: j.data[0].url });
      if (j.data[1]?.url) f.push({ id: "sd", label: "SD", url: j.data[1].url });

      return res.json({
        ok: true,
        data: {
          platform: "facebook",
          title: j.title,
          thumbnail: j.thumbnail,
          formats: f
        }
      });
    }

    /* ==============================
       YOUTUBE (Yt1s clone)
    ===============================*/
    if (platform === "youtube") {
      const r = await fetch("https://yt1s.com/api/ajaxSearch/index", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `q=${encodeURIComponent(url)}&vt=home`
      });

      const j = await r.json();
      if (!j?.links) return res.json({ ok: false });

      const out = [];

      // Video
      for (let k in j.links.mp4) {
        out.push({
          id: k,
          label: j.links.mp4[k].q,
          url: j.links.mp4[k].k
        });
      }

      // Audio
      for (let k in j.links.mp3) {
        out.push({
          id: k,
          label: j.links.mp3[k].q,
          url: j.links.mp3[k].k
        });
      }

      return res.json({
        ok: true,
        data: {
          platform: "youtube",
          title: j.title,
          thumbnail: j.img,
          formats: out
        }
      });
    }

    return res.json({ ok: false, msg: "Platform not supported" });

  } catch (e) {
    return res.status(500).json({ ok: false, msg: "Server error", error: e.toString() });
  }
}
