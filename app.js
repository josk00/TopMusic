const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const fallbackTracks = [
  { title:"Blinding Lights", artist:"The Weeknd", genre:"Pop" },
  { title:"Starboy", artist:"The Weeknd", genre:"Pop" },
  { title:"HUMBLE.", artist:"Kendrick Lamar", genre:"Hip-Hop" },
  { title:"FE!N", artist:"Travis Scott", genre:"Hip-Hop" },
  { title:"Do I Wanna Know?", artist:"Arctic Monkeys", genre:"Rock" },
  { title:"505", artist:"Arctic Monkeys", genre:"Rock" }
];

let results = fallbackTracks;
let favorites = JSON.parse(localStorage.getItem("topmusic_fav") || "[]");
let filter = "all";
let current = null;
let playing = false;
let audio = null;
let searchTimer = null;
let jsonpCounter = 0;

const tracksEl = document.getElementById("tracks");
const searchInput = document.getElementById("searchInput");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function coverStyle(url) {
  return url
    ? `background-image:url("${url}");background-size:cover;background-position:center;`
    : "";
}

function renderTracks(list = results) {
  const q = searchInput.value.trim().toLowerCase();

  const filtered = list.filter(t => {
    const text = `${t.title} ${t.artist}`.toLowerCase();
    const genreOk = filter === "all" || (t.genre || "").toLowerCase().includes(filter);
    return genreOk && text.includes(q);
  });

  tracksEl.innerHTML = filtered.length ? filtered.map((t, i) => `
    <div class="track">
      <div class="cover" style="${coverStyle(t.artwork)}">♪</div>
      <div class="track-info">
        <b>${escapeHtml(t.title)}</b>
        <small>${escapeHtml(t.artist)}</small>
      </div>
      <button onclick="toggleFav(${i})">${favorites.includes(t.id || t.title) ? "♥" : "♡"}</button>
      <button onclick="selectTrack(${i})">▶</button>
    </div>
  `).join("") : `<div class="empty">Ничего не найдено</div>`;
}

function toggleFav(index) {
  const visible = results.filter(t => {
    const q = searchInput.value.trim().toLowerCase();
    const genreOk = filter === "all" || (t.genre || "").toLowerCase().includes(filter);
    return genreOk && `${t.title} ${t.artist}`.toLowerCase().includes(q);
  });
  const t = visible[index];
  if (!t) return;

  const id = t.id || t.title;
  favorites = favorites.includes(id)
    ? favorites.filter(x => x !== id)
    : [...favorites, id];

  localStorage.setItem("topmusic_fav", JSON.stringify(favorites));
  renderTracks();
}

function selectTrack(index) {
  const visible = results.filter(t => {
    const q = searchInput.value.trim().toLowerCase();
    const genreOk = filter === "all" || (t.genre || "").toLowerCase().includes(filter);
    return genreOk && `${t.title} ${t.artist}`.toLowerCase().includes(q);
  });

  current = visible[index];
  if (!current) return;

  document.getElementById("player").style.display = "flex";
  document.getElementById("playerTitle").textContent = current.title;
  document.getElementById("playerArtist").textContent = current.artist;
  document.getElementById("playerCover").style.backgroundImage = current.artwork ? `url("${current.artwork}")` : "";
  document.getElementById("playerCover").style.backgroundSize = "cover";

  if (audio) audio.pause();
  audio = current.preview ? new Audio(current.preview) : null;

  if (audio) {
    audio.play().catch(() => {});
    playing = true;
    document.getElementById("playBtn").textContent = "❚❚";
  } else {
    playing = false;
    document.getElementById("playBtn").textContent = "▶";
  }

  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

document.getElementById("playBtn").onclick = () => {
  if (!audio) return;

  if (playing) {
    audio.pause();
    playing = false;
    document.getElementById("playBtn").textContent = "▶";
  } else {
    audio.play().catch(() => {});
    playing = true;
    document.getElementById("playBtn").textContent = "❚❚";
  }
};

function searchMusic(term) {
  const query = term.trim();
  if (!query) {
    results = fallbackTracks;
    renderTracks();
    return;
  }

  tracksEl.innerHTML = `<div class="empty">Ищу музыку…</div>`;

  const callback = `topMusicSearch_${++jsonpCounter}`;

  window[callback] = data => {
    delete window[callback];
    script.remove();

    results = (data.results || []).filter(x => x.kind === "song").map(x => ({
      id: x.trackId,
      title: x.trackName,
      artist: x.artistName,
      genre: x.primaryGenreName || "",
      artwork: x.artworkUrl100 ? x.artworkUrl100.replace("100x100", "300x300") : "",
      preview: x.previewUrl || "",
      storeUrl: x.trackViewUrl || ""
    }));

    filter = "all";
    document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
    document.querySelector('.chip[data-filter="all"]')?.classList.add("active");

    renderTracks();
  };

  const script = document.createElement("script");
  script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=US&media=music&entity=song&limit=25&explicit=no&callback=${callback}`;
  script.onerror = () => {
    delete window[callback];
    script.remove();
    tracksEl.innerHTML = `<div class="empty">Не удалось выполнить поиск. Попробуй ещё раз.</div>`;
  };
  document.body.appendChild(script);
}

searchInput.oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => searchMusic(searchInput.value), 450);
};

document.querySelectorAll(".chip").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
    button.classList.add("active");
    filter = button.dataset.filter;
    renderTracks();
  };
});

document.getElementById("profileBtn").onclick = () => {
  document.querySelector('[data-tab="profile"]')?.click();
};

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.onclick = () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");

    const content = document.getElementById("content");

    if (tab === "home") {
      content.innerHTML = `
        <h2>Поиск музыки</h2>
        <div class="chips">
          <button class="chip active" data-filter="all">Все</button>
          <button class="chip" data-filter="pop">Pop</button>
          <button class="chip" data-filter="hiphop">Hip-Hop</button>
          <button class="chip" data-filter="rock">Rock</button>
        </div>
        <div id="tracks" class="tracks"></div>`;
      location.reload();
    }

    if (tab === "favorites") {
      const fav = results.filter(t => favorites.includes(t.id || t.title));
      content.innerHTML = `<h2>Избранное</h2><div class="tracks">${
        fav.length
          ? fav.map(t => `<div class="track">
              <div class="cover" style="${coverStyle(t.artwork)}">♪</div>
              <div class="track-info"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.artist)}</small></div>
              <button onclick="selectTrack(${results.indexOf(t)})">▶</button>
            </div>`).join("")
          : `<div class="empty">Найди музыку и добавь её в избранное ♡</div>`
      }</div>`;
    }

    if (tab === "profile") {
      const u = tg?.initDataUnsafe?.user;
      const name = u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : "Пользователь TopMusic";
      content.innerHTML = `<div class="profile-card">
        <div class="profile-big">♪</div>
        <h2>${escapeHtml(name)}</h2>
        <p style="color:#888">${u?.username ? "@" + escapeHtml(u.username) : "Telegram Mini App"}</p>
      </div>`;
    }
  };
});

renderTracks();
