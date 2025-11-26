const fetch = require("node-fetch");

function err(res, msg) {
  return res.status(500).json({ ok:false, msg });
}

module.exports = async (req, res) => {
  try {
    const url = (req.query.url || "").trim();
    if (!url) return res.status(400).json({ ok:false, msg: "No URL provided" });

    const lower = url.toLowerCase();
    let platform = "unknown";

    if (lower.includes("tiktok.com") || lower.includes("vt.tiktok")) platform = "tiktok";
    else if (lower.includes("instagram.com")) platform = "instagram";
    else if (lower.includes("facebook.com") || lower.includes("fb.watch")) platform = "facebook";
    else if (lower.includes("youtube") || lower.includes("youtu.be")) platform = "youtube";

    // ===== TikTok =====
    if (platform === "tiktok") {
      const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      if (!j?.data) return err(res, "TikTok error");

      return res.json({
        ok: true,
        platform,
        title: j.data.title,
        thumbnail: j.data.cover,
        formats: [
          { quality: "no_wm", url: j.data.play },
          { quality: "wm", url: j.data.wmplay },
          { quality: "music", url: j.data.music }
        ]
      });
    }

    // ===== Instagram =====
    if (platform === "instagram") {
      const r = await fetch(`https://instagramdownloader.io/api/v1/instagram?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      if (!j?.download_url) return err(res,"IG error");

      return res.json({
        ok:true,
        platform,
        title:j.title || "Instagram Media",
        thumbnail:j.thumbnail,
        formats:[ {quality:"default",url:j.download_url} ]
      });
    }

    // ===== Facebook =====
    if (platform === "facebook") {
      const r = await fetch("https://snapsave.app/api/ajaxSearch", {
        method:"POST",
        headers:{ "Content-Type":"application/x-www-form-urlencoded" },
        body: `q=${encodeURIComponent(url)}`
      });
      const j = await r.json();
      if (!j?.data) return err(res, "Facebook error");

      const f = [];
      if (j.data[0]?.url) f.push({quality:"hd",url:j.data[0].url});
      if (j.data[1]?.url) f.push({quality:"sd",url:j.data[1].url});

      return res.json({
        ok:true,
        platform,
        title:j.title,
        thumbnail:j.thumbnail,
        formats:f
      });
    }

    // ===== YouTube =====
    if (platform === "youtube") {
      const r = await fetch("https://yt1s.com/api/ajaxSearch/index", {
        method:"POST",
        headers:{ "Content-Type":"application/x-www-form-urlencoded" },
        body:`q=${encodeURIComponent(url)}&vt=home`
      });
      const j = await r.json();
      if (!j?.links) return err(res, "YouTube error");

      const f = [];
      if (j.links.mp4) for (const k in j.links.mp4) f.push({ quality:j.links.mp4[k].q, url:j.links.mp4[k].k });
      if (j.links.mp3) for (const k in j.links.mp3) f.push({ quality:j.links.mp3[k].q, url:j.links.mp3[k].k });

      return res.json({
        ok:true,
        platform,
        title:j.title,
        thumbnail:j.thumb,
        formats:f
      });
    }

    return err(res,"Unsupported platform");
  } catch(e){
    return err(res, e.toString());
  }
};
