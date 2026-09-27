(() => {
  "use strict";
  const base = window.TONGPIN_API;
  if (!base) return;
  if (!/^https:\/\//.test(base)) throw Error("HTTPS API required");
  const key = "tongpin-ownership-v1";
  let tokens;
  try {
    tokens = JSON.parse(localStorage.getItem(key) || "{}");
    if (!tokens || Array.isArray(tokens) || typeof tokens !== "object")
      throw Error();
  } catch {
    tokens = {};
  }
  function persist() {
    localStorage.setItem(key, JSON.stringify(tokens));
  }
  async function request(
    path,
    { method = "GET", body, token, raw = false } = {},
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch(base + path, {
        method,
        signal: controller.signal,
        headers: {
          ...(body
            ? {
                "Content-Type": raw
                  ? "application/octet-stream"
                  : "application/json",
              }
            : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: body ? (raw ? body : JSON.stringify(body)) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "云端请求失败");
      return data;
    } catch (e) {
      if (e.name === "AbortError")
        throw Error("连接超时，资料未确认保存，请重试。");
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }
  const tokenFor = (id) => tokens[id];
  async function save(input, old) {
    const fields = Object.fromEntries(
      ["name", "wechat", "city", "headline", "bio", "categories", "tags"].map(
        (k) => [k, input[k]],
      ),
    );
    let current = old,
      token = old ? tokenFor(old.id) : tokens.pending;
    if (old && !token) throw Error("缺少编辑凭证，请先恢复凭证");
    if (!token) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
        x.toString(16).padStart(2, "0"),
      ).join("");
      tokens.pending = token;
      persist();
    }
    if (!current) {
      current = await request("/profiles", {
        method: "POST",
        body: fields,
        token,
      });
      tokens[current.id] = token;
      delete tokens.pending;
      persist();
    }
    const existing = new Map(
      current.photos.map((url, i) => [url, current.photoKeys[i]]),
    );
    if (current.avatar) existing.set(current.avatar, current.avatarKey);
    const upload = async (src) => {
      if (!src) return "";
      if (existing.has(src)) return existing.get(src);
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(src))
        throw Error("图片已失效，请重新选择");
      const blob = await (await fetch(src)).blob();
      return (
        await request("/profiles/" + current.id + "/images", {
          method: "POST",
          body: blob,
          raw: true,
          token,
        })
      ).key;
    };
    try {
      const avatarKey = await upload(input.avatar);
      const photoKeys = [];
      for (const src of input.photos) photoKeys.push(await upload(src));
      return await request("/profiles/" + current.id, {
        method: "PUT",
        token,
        body: { ...fields, avatarKey, photoKeys, revision: current.revision },
      });
    } catch (e) {
      e.savedProfile = current;
      throw e;
    }
  }
  window.TongpinCloud = {
    async list() {
      return (await request("/profiles")).profiles;
    },
    owns: (p) => !!tokenFor(p.id),
    save,
    async remove(p) {
      await request("/profiles/" + p.id, {
        method: "DELETE",
        token: tokenFor(p.id),
        body: { revision: p.revision },
      });
      delete tokens[p.id];
      persist();
    },
    backup(p) {
      const blob = new Blob(
        [JSON.stringify({ id: p.id, token: tokenFor(p.id) })],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tongpin-edit-key.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    async restore(file) {
      const value = JSON.parse(await file.text());
      if (
        !/^[a-f0-9]{32}$/.test(value.id) ||
        !/^[a-f0-9]{64}$/.test(value.token)
      )
        throw Error("凭证格式不正确");
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(value.token),
          ),
        ),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      if (hash.slice(0, 32) !== value.id) throw Error("凭证不匹配");
      tokens[value.id] = value.token;
      persist();
    },
  };
})();
