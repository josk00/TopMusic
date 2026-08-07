const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// ===============================
// TopMusic — real music search
// ===============================

const searchInput = document.getElementById("searchInput");
const tracksEl = document.getElementById("tracks");
const favoritesEl = document.getElementById("favorites");

let results = [];
let favorites = JSON.parse(localStorage.getItem("topmusic_favorites") || "[]");
let currentAudio = null;
let currentTrackId = null;
let searchTimer = null;

// -------------------------------
// Helpers
// -------------------------------

function saveFavorites() {
    localStorage.setItem(
        "topmusic_favorites",
        JSON.stringify(favorites)
    );
}

function escapeHTML(text = "") {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// -------------------------------
// Search
// -------------------------------

async function searchMusic(query) {
    query = query.trim();

    if (!query) {
        loadPopular();
        return;
    }

    tracksEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:#888">
            Поиск...
        </div>
    `;

    try {
        const url =
            "https://itunes.apple.com/search" +
            "?term=" + encodeURIComponent(query) +
            "&media=music" +
            "&entity=song" +
            "&limit=30";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Search error");
        }

        const data = await response.json();

        results = data.results || [];

        renderTracks(results);

    } catch (error) {
        console.error(error);

        tracksEl.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888">
                Не удалось выполнить поиск
            </div>
        `;
    }
}

// -------------------------------
// Popular music
// -------------------------------

async function loadPopular() {
    tracksEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:#888">
            Загрузка...
        </div>
    `;

    try {
        const url =
            "https://itunes.apple.com/search" +
            "?term=popular" +
            "&media=music" +
            "&entity=song" +
            "&limit=30";

        const response = await fetch(url);
        const data = await response.json();

        results = data.results || [];

        renderTracks(results);

    } catch (error) {
        console.error(error);

        tracksEl.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888">
                Не удалось загрузить музыку
            </div>
        `;
    }
}

// -------------------------------
// Render tracks
// -------------------------------

function renderTracks(tracks) {

    if (!tracks.length) {
        tracksEl.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888">
                Ничего не найдено
            </div>
        `;
        return;
    }

    tracksEl.innerHTML = tracks.map(track => {

        const id = track.trackId;

        const title = escapeHTML(
            track.trackName || "Unknown"
        );

        const artist = escapeHTML(
            track.artistName || "Unknown artist"
        );

        const artwork = track.artworkUrl100
            ? track.artworkUrl100.replace(
                "100x100",
                "300x300"
            )
            : "";

        const isFavorite = favorites.some(
            item => item.trackId === id
        );

        return `
            <div class="track" data-id="${id}">

                <div class="track-cover">
                    ${
                        artwork
                        ? `<img src="${artwork}" alt="">`
                        : `<span>♪</span>`
                    }
                </div>

                <div class="track-info">
                    <div class="track-title">
                        ${title}
                    </div>

                    <div class="track-artist">
                        ${artist}
                    </div>
                </div>

                <button
                    class="favorite-btn"
                    onclick="toggleFavorite(${id})"
                >
                    ${isFavorite ? "♥" : "♡"}
                </button>

                <button
                    class="play-btn"
                    onclick="playTrack(${id})"
                >
                    ▶
                </button>

            </div>
        `;

    }).join("");
}

// -------------------------------
// Play preview
// -------------------------------

function playTrack(id) {

    const track = results.find(
        item => item.trackId === id
    );

    if (!track || !track.previewUrl) {
        alert("Для этого трека preview недоступен.");
        return;
    }

    if (currentAudio && currentTrackId === id) {

        if (currentAudio.paused) {
            currentAudio.play();
        } else {
            currentAudio.pause();
        }

        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    currentAudio = new Audio(track.previewUrl);
    currentTrackId = id;

    currentAudio.play().catch(error => {
        console.error(error);
    });

    currentAudio.onended = () => {
        currentAudio = null;
        currentTrackId = null;
    };
}

// -------------------------------
// Favorites
// -------------------------------

function toggleFavorite(id) {

    const track = results.find(
        item => item.trackId === id
    );

    if (!track) return;

    const index = favorites.findIndex(
        item => item.trackId === id
    );

    if (index === -1) {
        favorites.push(track);
    } else {
        favorites.splice(index, 1);
    }

    saveFavorites();

    renderTracks(results);
    renderFavorites();
}

function renderFavorites() {

    if (!favoritesEl) return;

    if (!favorites.length) {
        favoritesEl.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888">
                Избранное пусто
            </div>
        `;
        return;
    }

    favoritesEl.innerHTML = favorites.map(track => {

        const title = escapeHTML(
            track.trackName || "Unknown"
        );

        const artist = escapeHTML(
            track.artistName || "Unknown artist"
        );

        const artwork = track.artworkUrl100
            ? track.artworkUrl100.replace(
                "100x100",
                "300x300"
            )
            : "";

        return `
            <div class="track">

                <div class="track-cover">
                    ${
                        artwork
                        ? `<img src="${artwork}" alt="">`
                        : `<span>♪</span>`
                    }
                </div>

                <div class="track-info">
                    <div class="track-title">
                        ${title}
                    </div>

                    <div class="track-artist">
                        ${artist}
                    </div>
                </div>

                <button
                    class="favorite-btn"
                    onclick="toggleFavorite(${track.trackId})"
                >
                    ♥
                </button>

            </div>
        `;

    }).join("");
}

// -------------------------------
// Search input
// -------------------------------

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            clearTimeout(searchTimer);

            const query = this.value;

            searchTimer = setTimeout(() => {
                searchMusic(query);
            }, 500);

        }
    );
}

// -------------------------------
// Navigation
// -------------------------------

const homeButton =
    document.getElementById("homeBtn");

const favoritesButton =
    document.getElementById("favoritesBtn");

const profileButton =
    document.getElementById("profileBtn");

const homePage =
    document.getElementById("homePage");

const favoritesPage =
    document.getElementById("favoritesPage");

const profilePage =
    document.getElementById("profilePage");

function showPage(page) {

    if (homePage) homePage.style.display = "none";
    if (favoritesPage) favoritesPage.style.display = "none";
    if (profilePage) profilePage.style.display = "none";

    if (page) page.style.display = "block";
}

if (homeButton) {
    homeButton.onclick = () => {
        showPage(homePage);
        loadPopular();
    };
}

if (favoritesButton) {
    favoritesButton.onclick = () => {
        showPage(favoritesPage);
        renderFavorites();
    };
}

if (profileButton) {
    profileButton.onclick = () => {
        showPage(profilePage);
    };
}

// -------------------------------
// Start
// -------------------------------

loadPopular();
renderFavorites();;
