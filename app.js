(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const categories = [
    ["全部群友", "layout-grid"],
    ["设计创意", "palette"],
    ["技术开发", "code-xml"],
    ["AI 与自动化", "bot"],
    ["内容创作", "pen-line"],
    ["营销运营", "megaphone"],
    ["商业服务", "briefcase-business"],
    ["科研与教育", "graduation-cap"],
    ["资源对接", "network"],
    ["生活技能", "coffee"],
    ["其他能力", "sparkles"],
  ];
  const finder = window.TongpinFinder;
  const cloud = window.TongpinCloud;
  const owns = (p) => !p.demo && (!cloud || cloud.owns(p));
  let page = 1;
  const pageSize = 12;
  const demos = [
    [
      "小林",
      "杭州",
      "把好想法，变成好看的设计。",
      "设计创意",
      "品牌设计,UI / UX,Figma",
      "独立设计师，关注品牌与数字产品。擅长从零梳理视觉方向，希望遇到对产品有想法的朋友。",
    ],
    [
      "阿哲",
      "深圳",
      "写代码，也喜欢把点子做出来。",
      "技术开发",
      "全栈开发,AI 工具,小程序",
      "做过网站、小程序和效率工具。喜欢简单实用的产品，期待和设计、运营的朋友一起打磨有价值的想法。",
    ],
    [
      "米粒",
      "上海",
      "用文字和镜头，记录值得分享的事。",
      "内容创作",
      "文案策划,短视频,摄影",
      "自由内容创作者，擅长品牌故事和短视频策划。可以一起聊选题、拍摄，或把一个好故事讲给更多人听。",
    ],
    [
      "大可",
      "北京",
      "让好产品，被对的人看见。",
      "营销运营",
      "社群运营,用户增长,活动策划",
      "做过社群和品牌活动，擅长把零散想法梳理成可执行的方案。想认识认真做产品、愿意长期合作的朋友。",
    ],
    [
      "向晚",
      "成都",
      "把复杂的事，理成清楚的路。",
      "商业服务",
      "商业分析,项目管理,数据分析",
      "关注小团队的业务规划和项目协作。擅长拆目标、理流程，也乐意一起探索新业务的可能性。",
    ],
    [
      "老周",
      "广州",
      "工作之外，也把生活过得有意思。",
      "生活技能",
      "咖啡,户外徒步,手作",
      "日常研究咖啡和手作，周末喜欢走进山野。可以交流咖啡入门、装备经验，也期待认识有共同爱好的朋友。",
    ],
  ].map((a, i) => ({
    id: "demo-" + i,
    name: a[0],
    city: a[1],
    headline: a[2],
    categories: [a[3]],
    tags: a[4].split(","),
    bio: a[5],
    avatar: `avatar-${[47, 12, 44, 13, 49, 60][i]}.jpg`,
    photos: ["community.jpg"],
    created: 6 - i,
    demo: true,
  }));
  const key = "tongpin-profiles-v1";
  let profiles = [],
    active = "全部群友",
    hideDemos = false,
    editing = null,
    photos = [],
    avatarImage = "",
    uploading = false,
    toastTimer;
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const validPhoto = (p) =>
    typeof p === "string" &&
    (/^data:image\/(jpeg|png|webp);base64,/.test(p) ||
      (!!cloud && /^https:\/\/tongpin-images-(?:20260927\.oss-cn-shanghai|hk-20260927\.oss-cn-hongkong)\.aliyuncs\.com\/profiles\//.test(p)));
  function validProfile(p) {
    return (
      p &&
      typeof p.id === "string" &&
      ["name", "headline", "bio", "city"].every(
        (k) => typeof p[k] === "string",
      ) &&
      (p.wechat === undefined || typeof p.wechat === "string") &&
      (p.avatar === undefined || p.avatar === "" || validPhoto(p.avatar)) &&
      Array.isArray(p.categories) &&
      p.categories.length &&
      p.categories.every((c) => categories.slice(1).some((x) => x[0] === c)) &&
      Array.isArray(p.tags) &&
      p.tags.every((t) => typeof t === "string") &&
      Array.isArray(p.photos) &&
      p.photos.length <= 3 &&
      p.photos.every(validPhoto) &&
      typeof p.created === "number" &&
      !p.demo
    );
  }
  if (!cloud)
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(saved) || !saved.every(validProfile)) throw Error();
      profiles = saved;
    } catch {
      showToast("本机资料无法读取；现有存储未被改动。");
    }
  function icons() {
    window.lucide?.createIcons();
  }
  function showToast(message) {
    $("#toast").textContent = message;
    $("#toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("#toast").hidden = true), 4000);
  }
  function persist(next) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      profiles = next;
      return true;
    } catch {
      showToast("未能保存：浏览器存储已满或不可用。请减少图片后重试。");
      return false;
    }
  }
  function all() {
    return [
      ...profiles.filter((p) => !$("#mine").checked || owns(p)),
      ...(cloud || hideDemos || $("#mine").checked ? [] : demos),
    ];
  }
  function matches() {
    return finder.rank(all(), {
      query: $("#search").value,
      category: active,
      city: $("#city").value,
      sort: $("#sort").value,
    });
  }
  function visible() {
    return matches().map((m) => m.profile);
  }
  function avatar(p, i) {
    const src = p.avatar === undefined ? p.photos[0] : p.avatar;
    return `<div class="avatar tone-${i % 6}">${src ? `<img src="${escape(src)}" alt="${escape(p.name)}的头像">` : escape(Array.from(p.name)[0] || "友")}</div>`;
  }
  function render(resetPage = true) {
    if (resetPage) page = 1;
    const city = $("#city").value;
    const cities = [
      ...new Set(
        all()
          .map((p) => p.city.trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "zh-CN"));
    if (city && !cities.includes(city)) cities.push(city);
    $("#city").innerHTML =
      '<option value="">不限城市</option>' +
      cities
        .map((c) => `<option value="${escape(c)}">${escape(c)}</option>`)
        .join("");
    $("#city").value = city;
    $("#categories").innerHTML = categories
      .map(
        ([name, icon]) =>
          `<button class="category ${active === name ? "active" : ""}" data-category="${name}" aria-pressed="${active === name}"><i data-lucide="${icon}"></i>${name}<span class="category-count">${all().filter((p) => name === "全部群友" || p.categories.includes(name)).length}</span></button>`,
      )
      .join("");
    const ranked = matches();
    const reasons = new Map(ranked.map((m) => [m.profile.id, m.reasons]));
    const found = ranked.map((m) => m.profile);
    $("#result-title").innerHTML =
      `${escape(active)} <span>${found.length}</span>`;
    const pages = Math.max(1, Math.ceil(found.length / pageSize));
    page = Math.min(page, pages);
    $("#pagination").hidden = pages <= 1;
    $("#page-info").textContent =
      `${page} / ${pages} 页 · ${found.length} 位群友`;
    $("#prev-page").disabled = page <= 1;
    $("#next-page").disabled = page >= pages;
    const query = $("#search").value.trim();
    $("#query-summary").hidden = !query && !city && active === "全部群友";
    $("#query-summary").innerHTML =
      `<span>${query ? "“" + escape(query) + "” · " : ""}${city ? escape(city) + " · " : ""}找到 ${found.length} 位群友</span><button id="clear-filters">清除筛选</button>`;
    $("#sample-note").hidden = false;
    $("#sample-note").style.display = cloud || $("#mine").checked ? "none" : "flex";
    $("#sample-note span").textContent = hideDemos
      ? "示例资料已隐藏"
      : "示例人物与资料仅用于展示";
    $("#hide-samples").textContent = hideDemos ? "显示示例" : "隐藏示例";
    $("#cards").innerHTML = found
      .slice((page - 1) * pageSize, page * pageSize)
      .map(
        (p, i) =>
          `<article class="person"><button class="person-open" data-detail="${escape(p.id)}" aria-label="认识${escape(p.name)}"><div class="person-top">${avatar(p, i)}<span class="person-category">${escape(p.categories[0])}</span></div><div class="person-name-row"><h3>${escape(p.name)}</h3><span class="meta">${escape(p.city || "")} ${p.demo ? "· 示例" : ""}</span></div><p class="card-intro">${escape(p.headline)}</p>${query ? `<p class="match-reason">匹配${escape((reasons.get(p.id) || []).slice(0, 2).join(" · "))}</p>` : ""}<div class="person-bottom"><span class="mini-tags">${escape((p.tags.length ? p.tags : p.categories).slice(0, 3).join(" / "))}</span><span class="card-arrow"><i data-lucide="arrow-up-right"></i></span></div></button></article>`,
      )
      .join("");
    $("#empty").hidden = found.length > 0;
    icons();
  }
  function openEditor(p) {
    editing = p?.id || null;
    photos = p ? [...p.photos] : [];
    avatarImage = p ? (p.avatar ?? p.photos[0] ?? "") : "";
    $("#profile-form").reset();
    $("#form-error").textContent = "";
    $("#photos").value = "";
    $("#editor-title").textContent = p
      ? "编辑我的名片"
      : "你的下一次连接，从这里开始。";
    $("#category-options").innerHTML = categories
      .slice(1)
      .map(
        ([c]) =>
          `<label><input type="checkbox" name="category" value="${c}" ${p?.categories.includes(c) ? "checked" : ""}>${c}</label>`,
      )
      .join("");
    if (p)
      for (const k of ["name", "wechat", "city", "headline", "bio", "tags"])
        $("#profile-form").elements[k].value =
          k === "tags" ? p.tags.join("，") : p[k] || "";
    renderSkillSuggestions();
    renderPhotos();
    renderAvatar();
    $("#editor").showModal();
    $("#editor").scrollTop = 0;
  }
  function renderSkillSuggestions() {
    let host = $("#skill-suggestions");
    if (!host) {
      host = document.createElement("div");
      host.id = "skill-suggestions";
      host.className = "skill-suggestions";
      $("#profile-form").elements.tags.parentElement.after(host);
    }
    const selected = [
      ...document.querySelectorAll("[name=category]:checked"),
    ].map((x) => x.value);
    const tags = $("#profile-form")
      .elements.tags.value.split(/[,，、\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const choices = [
      ...new Set(selected.flatMap((c) => finder.skills[c] || [])),
    ];
    host.innerHTML = choices.length
      ? "<span>常用技能</span>" +
        choices
          .map(
            (t) =>
              `<button type="button" data-skill="${escape(t)}" aria-pressed="${tags.includes(t)}">${escape(t)}</button>`,
          )
          .join("")
      : "";
  }
  $("#category-options").addEventListener("change", renderSkillSuggestions);
  $("#profile-form").elements.tags.addEventListener(
    "input",
    renderSkillSuggestions,
  );
  $("#profile-form").addEventListener("click", (e) => {
    const b = e.target.closest("[data-skill]");
    if (!b) return;
    let tags = $("#profile-form")
      .elements.tags.value.split(/[,，、\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (tags.includes(b.dataset.skill))
      tags = tags.filter((t) => t !== b.dataset.skill);
    else if (tags.length < 5) tags.push(b.dataset.skill);
    else {
      showToast("最多选择 5 个技能标签。");
      return;
    }
    $("#profile-form").elements.tags.value = tags.join("，");
    renderSkillSuggestions();
  });
  function renderAvatar() {
    $("#avatar-preview").innerHTML = avatarImage
      ? `<img src="${escape(avatarImage)}" alt="我的头像预览">`
      : '<i data-lucide="camera"></i>';
    $("#remove-avatar").hidden = !avatarImage;
    icons();
  }
  function setUploading(value) {
    uploading = value;
    for (const id of ["save", "photos", "avatar-file", "remove-avatar"])
      $("#" + id).disabled = value;
  }
  function renderPhotos() {
    $("#photo-previews").innerHTML = photos
      .map(
        (src, i) =>
          `<div class="preview-photo"><img src="${escape(src)}" alt="待保存图片 ${i + 1}"><button type="button" data-remove="${i}" aria-label="移除图片 ${i + 1}" title="移除图片"><i data-lucide="x"></i></button></div>`,
      )
      .join("");
    icons();
  }
  async function compress(file) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw Error("仅支持 JPG、PNG、WebP 图片。");
    if (file.size > 5 * 1024 * 1024) throw Error("每张图片不能超过 5 MB。");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const ratio = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.8);
    } catch (e) {
      throw Error(
        e.message === "每张图片不能超过 5 MB。"
          ? e.message
          : "图片无法读取，请选择有效的图片文件。",
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  $("#photos").addEventListener("change", async (e) => {
    const files = [...e.target.files];
    $("#form-error").textContent = "";
    if (photos.length + files.length > 3) {
      $("#form-error").textContent = "最多上传 3 张图片。";
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const next = [];
      for (const f of files) next.push(await compress(f));
      photos.push(...next);
      renderPhotos();
    } catch (error) {
      $("#form-error").textContent = error.message;
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  });
  $("#avatar-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    $("#form-error").textContent = "";
    setUploading(true);
    try {
      avatarImage = await compress(file);
      renderAvatar();
    } catch (error) {
      $("#form-error").textContent = error.message;
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  });
  $("#remove-avatar").onclick = () => {
    avatarImage = "";
    renderAvatar();
  };
  $("#photo-previews").addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (b) {
      photos.splice(Number(b.dataset.remove), 1);
      renderPhotos();
    }
  });
  $("#profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (uploading) return;
    const form = e.target;
    const data = new FormData(form);
    const selected = data.getAll("category");
    if (!selected.length) {
      $("#form-error").textContent = "请选择至少一个擅长领域。";
      return;
    }
    const p = {
      id:
        editing ||
        "local-" + Date.now() + "-" + Math.random().toString(36).slice(2),
      name: data.get("name").trim(),
      wechat: data.get("wechat").trim(),
      avatar: avatarImage,
      city: data.get("city").trim(),
      headline: data.get("headline").trim(),
      bio: data.get("bio").trim(),
      categories: selected,
      tags: [
        ...new Set(
          data
            .get("tags")
            .split(/[,，、\n]/)
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ].slice(0, 5),
      photos: [...photos],
      created: profiles.find((x) => x.id === editing)?.created || Date.now(),
    };
    if (!p.name || !p.headline || !p.bio) {
      $("#form-error").textContent = "微信名称、简单介绍和详细介绍不能为空。";
      return;
    }
    if(cloud){
      setUploading(true);$('#form-error').textContent='正在保存到云端…';
      try{const saved=await cloud.save(p,profiles.find(x=>x.id===editing));profiles=[...profiles.filter(x=>x.id!==saved.id),saved];}
      catch(error){if(error.savedProfile){const saved=error.savedProfile;editing=saved.id;profiles=[...profiles.filter(x=>x.id!==saved.id),saved];render();}$('#form-error').textContent=(error.savedProfile?'文字资料已保存，图片或后续更新失败。':'保存未成功。')+error.message;return;}
      finally{setUploading(false);}
    }else if (!persist([...profiles.filter((x) => x.id !== editing), p])) return;
    $("#editor").close();
    active = "全部群友";
    $("#search").value = "";
    $("#city").value = "";
    render();
    document
      .querySelector("#directory")
      .scrollIntoView({ behavior: "instant" });
    showToast(cloud?"名片已保存到云端，群友可以看到了。":"名片已保存在当前浏览器。");
  });
  function detail(id) {
    const p = [...profiles, ...demos].find((x) => x.id === id);
    if (!p) return;
    $("#detail-content").innerHTML =
      `<div class="detail-profile">${avatar(p, 0)}<div><h2 id="detail-title">${escape(p.name)}</h2><div class="meta"><i data-lucide="map-pin"></i>${escape(p.city || "城市未填写")} · ${p.demo ? "演示人物，非真实群友" : cloud ? "群友名片" : "本机资料"}</div></div></div><p class="headline">${escape(p.headline)}</p><div class="tags">${[...p.categories, ...p.tags].map((t) => `<span class="tag">${escape(t)}</span>`).join("")}</div><h3 class="detail-section-title">关于我 / ABOUT ME</h3><p class="bio">${escape(p.bio)}</p>${p.photos.length ? `<h3 class="detail-section-title">${p.demo ? "示例配图" : "作品与日常"} / GALLERY</h3><div class="detail-images">${p.photos.map((src, i) => `<img src="${escape(src)}" alt="${p.demo ? "示例协作照片" : escape(p.name) + "的图片 " + (i + 1)}">`).join("")}</div>` : ""}${p.wechat ? `<p class="wechat-line"><i data-lucide="message-circle"></i>微信号：${escape(p.wechat)}</p>` : ""}<div class="detail-buttons"><button class="primary" id="copy-name"><i data-lucide="copy"></i>${p.wechat ? "复制微信号" : "复制微信名称"}</button>${owns(p) ? '<button class="secondary" id="edit-profile">编辑资料</button><button class="secondary danger" id="delete-profile">删除</button>' : ""}${cloud&&owns(p)?'<button class="secondary" id="backup-key">下载编辑凭证</button>':''}</div>`;
    icons();
    $("#copy-name").onclick = async () => {
      try {
        if (!navigator.clipboard) throw Error();
        await navigator.clipboard.writeText(p.wechat || p.name);
        showToast(
          p.wechat
            ? "微信号已复制。"
            : "微信名称已复制，可到群里寻找这位朋友。",
        );
      } catch {
        showToast("浏览器不支持复制，请长按或选中上方微信信息复制。");
      }
    };
    if(cloud&&owns(p))$('#backup-key').onclick=()=>cloud.backup(p);
    if (owns(p)) {
      $("#edit-profile").onclick = () => {
        $("#details").close();
        openEditor(p);
      };
      $("#delete-profile").onclick = async () => {
        if (!confirm(cloud?"删除这张云端名片？其他群友将无法再看到，此操作不可撤销。":"删除这张本机名片？此操作不可撤销。"))return;
        try{
          if(cloud){await cloud.remove(p);profiles=profiles.filter(x=>x.id!==p.id);}
          else if(!persist(profiles.filter(x=>x.id!==p.id)))return;
          $("#details").close();
          render();
          showToast("名片已删除。");
        }catch(error){showToast(error.message);}
      };
    }
    $("#details").showModal();
    $("#details").scrollTop = 0;
  }
  $("#categories").addEventListener("click", (e) => {
    const b = e.target.closest("[data-category]");
    if (b) {
      active = b.dataset.category;
      render();
    }
  });
  $("#cards").addEventListener("click", (e) => {
    const b = e.target.closest("[data-detail]");
    if (b) detail(b.dataset.detail);
  });
  $("#search").addEventListener("input", render);
  $("#sort").addEventListener("change", render);
  $("#mine").addEventListener("change", render);
  $("#hide-samples").onclick = () => {
    hideDemos = !hideDemos;
    render();
  };
  $("#add-top").onclick = () => openEditor();
  document.querySelectorAll(".close-editor").forEach(
    (b) =>
      (b.onclick = () => {
        if (!uploading) $("#editor").close();
      }),
  );
  $("#editor").addEventListener("cancel", (e) => {
    if (uploading) e.preventDefault();
  });
  $("#close-detail").onclick = () => $("#details").close();
  $("#reset").onclick = () => {
    active = "全部群友";
    $("#search").value = "";
    $("#mine").checked = false;
    hideDemos = false;
    render();
  };
  $("#add-bottom").onclick = () => openEditor();
  $("#city").addEventListener("change", render);
  function resetFilters() {
    active = "全部群友";
    $("#search").value = "";
    $("#city").value = "";
    $("#mine").checked = false;
    hideDemos = false;
    render();
  }
  $("#reset").onclick = resetFilters;
  $("#query-summary").addEventListener("click", (e) => {
    if (e.target.closest("#clear-filters")) resetFilters();
  });
  $("#needs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-need]");
    if (!b) return;
    active = "全部群友";
    $("#search").value = b.dataset.need;
    $("#sort").value = "relevance";
    render();
  });
  for (const [id, delta] of [
    ["prev-page", -1],
    ["next-page", 1],
  ])
    $("#" + id).onclick = () => {
      page += delta;
      render(false);
      $("#directory").scrollIntoView({ behavior: "instant" });
    };
  window.addEventListener("storage", (e) => {
    if (cloud) return;
    if (e.key !== key) return;
    try {
      const next = JSON.parse(e.newValue || "[]");
      if (Array.isArray(next) && next.every(validProfile)) {
        profiles = next;
        render();
      }
    } catch {}
  });
  render();
  if (cloud) {
    $(".storage-note").textContent = "保存后，资料和图片将在网站公开展示。请勿上传敏感信息。编辑凭证仅保存在当前浏览器，可在名片详情中下载备份，请勿转发。";
    $(".local-label").textContent = "群友共享资料库";
    const sync = document.createElement("button");
    sync.className = "secondary";
    sync.textContent = "正在同步资料";
    sync.type = "button";
    $(".list-meta").prepend(sync);
    const restore = document.createElement("button");
    restore.className = "secondary";
    restore.type = "button";
    restore.textContent = "恢复编辑凭证";
    const file = document.createElement("input");
    file.type = "file";
    file.accept = ".json,application/json";
    file.hidden = true;
    restore.onclick = () => file.click();
    file.onchange = async () => {
      try {
        if (!file.files[0]) return;
        if (file.files[0].size > 4096) throw Error("凭证文件过大");
        await cloud.restore(file.files[0]);
        render(false);
        toast("编辑凭证已恢复");
      } catch (e) { toast(e.message); }
      finally { file.value = ""; }
    };
    $(".list-meta").append(restore, file);
    let syncing = false;
    async function refresh() {
      if (syncing || uploading || $("#editor").open) return;
      syncing = true;
      sync.disabled = true;
      sync.textContent = "正在同步资料";
      try {
        const next = await cloud.list();
        if (!Array.isArray(next) || !next.every(validProfile)) throw Error("资料格式异常");
        profiles = next;
        render(false);
        sync.textContent = "资料已同步 · 刷新";
      } catch (e) {
        sync.textContent = "同步失败 · 点击重试";
        toast(e.message || "连接失败，请稍后重试");
      } finally { syncing = false; sync.disabled = false; }
    }
    sync.onclick = refresh;
    window.addEventListener("focus", refresh);
    setInterval(() => { if (!document.hidden) refresh(); }, 300000);
    refresh();
  }
  if (document.modelContext?.registerTool) {
    try {
      Promise.resolve(
        document.modelContext.registerTool({
          name: "search_members",
          description:
            "Search the locally displayed member directory. Does not publish or modify profiles.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string", maxLength: 100 } },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute(input) {
            if (
              !input ||
              typeof input.query !== "string" ||
              input.query.length > 100
            )
              throw Error("Invalid query");
            $("#search").value = input.query;
            render();
            return {
              members: visible().map((p) => ({
                name: p.name,
                headline: p.headline,
                demo: !!p.demo,
              })),
            };
          },
        }),
      ).catch(() => {});
    } catch {}
  }
})();
