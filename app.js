const pages = [
    "home",
    "music",
    "podcasts",
    "playlists",
    "repeat"
];

let currentPage = 0;


/* =========================
   PAGE NAVIGATION
========================= */

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.add("hidden");

        });


    const page =
        document.getElementById(pageName);

    if (page) {

        page.classList.remove("hidden");

    }


    currentPage =
        pages.indexOf(pageName);


    const title =
        document.getElementById(
            "page-title"
        );


    if (title) {

        title.textContent =
            pageName;
    }


    if (pageName === "music") {

        loadMusic();

    }

    if (pageName === "podcasts") {

        loadPodcasts();

    }

    if (pageName === "playlists") {

        loadPlaylists();

    }

    if (pageName === "repeat") {

        loadOnRepeat();

    }

}


function nextPage() {

    currentPage++;

    if (currentPage >= pages.length) {

        currentPage = 0;

    }

    showPage(
        pages[currentPage]
    );

}


function previousPage() {

    currentPage--;

    if (currentPage < 0) {

        currentPage =
            pages.length - 1;

    }

    showPage(
        pages[currentPage]
    );

}


/* =========================
   MUSIC
========================= */

async function loadMusic() {

    const container =
        document.getElementById(
            "music-list"
        );


    container.innerHTML =
        "Loading music...";


    try {

        const data =
            await spotifyFetch(
                "/me/tracks?limit=20"
            );


        container.innerHTML = "";


        data.items.forEach(item => {

            const track =
                item.track;


            const image =
                track.album.images?.[2]?.url ||
                track.album.images?.[0]?.url ||
                "";


            container.innerHTML += `

                <div class="media-item">

                    <img
                        src="${image}"
                    >

                    <div class="media-info">

                        <div
                            class="media-title"
                        >
                            ${escapeHTML(
                                track.name
                            )}
                        </div>

                        <div
                            class="media-subtitle"
                        >
                            ${escapeHTML(
                                track.artists
                                    .map(a => a.name)
                                    .join(", ")
                            )}
                        </div>

                    </div>

                </div>

            `;

        });


    } catch (error) {

        container.innerHTML =
            "Could not load your music.";

        console.error(error);

    }

}


/* =========================
   PODCASTS
========================= */

async function loadPodcasts() {

    const container =
        document.getElementById(
            "podcast-list"
        );


    container.innerHTML =
        "Loading podcasts...";


    try {

        const data =
            await spotifyFetch(
                "/me/shows?limit=20"
            );


        container.innerHTML = "";


        data.items.forEach(item => {

            const show =
                item.show;


            const image =
                show.images?.[2]?.url ||
                show.images?.[0]?.url ||
                "";


            container.innerHTML += `

                <div class="media-item">

                    <img
                        src="${image}"
                    >

                    <div class="media-info">

                        <div
                            class="media-title"
                        >
                            ${escapeHTML(
                                show.name
                            )}
                        </div>

                        <div
                            class="media-subtitle"
                        >
                            ${escapeHTML(
                                show.publisher
                            )}
                        </div>

                    </div>

                </div>

            `;

        });


    } catch (error) {

        container.innerHTML =
            "Could not load podcasts.";

        console.error(error);

    }

}


/* =========================
   PLAYLISTS
========================= */

async function loadPlaylists() {

    const container =
        document.getElementById(
            "playlist-list"
        );


    container.innerHTML =
        "Loading playlists...";


    try {

        const data =
            await spotifyFetch(
                "/me/playlists?limit=50"
            );


        container.innerHTML = "";


        data.items.forEach(playlist => {

            const image =
                playlist.images?.[2]?.url ||
                playlist.images?.[0]?.url ||
                "";


            container.innerHTML += `

                <div
                    class="media-item"
                    onclick="
                        window.open(
                            '${playlist.external_urls.spotify}',
                            '_blank'
                        )
                    "
                >

                    <img
                        src="${image}"
                    >

                    <div class="media-info">

                        <div
                            class="media-title"
                        >
                            ${escapeHTML(
                                playlist.name
                            )}
                        </div>

                        <div
                            class="media-subtitle"
                        >
                            ${playlist.items.total}
                            items
                        </div>

                    </div>

                </div>

            `;

        });


    } catch (error) {

        container.innerHTML =
            "Could not load playlists.";

        console.error(error);

    }

}


/* =========================
   ON REPEAT
========================= */

async function loadOnRepeat() {

    const container =
        document.getElementById(
            "repeat-list"
        );


    container.innerHTML =
        "Looking for On Repeat...";


    try {

        const data =
            await spotifyFetch(
                "/me/playlists?limit=50"
            );


        const repeat =
            data.items.find(
                playlist =>
                    playlist.name
                        .toLowerCase()
                        .includes("on repeat")
            );


        if (!repeat) {

            container.innerHTML =
                `
                <p>
                    I couldn't find your
                    On Repeat playlist.
                </p>
                `;

            return;

        }


        container.innerHTML = `

            <div
                class="media-item"
                onclick="
                    window.open(
                        '${repeat.external_urls.spotify}',
                        '_blank'
                    )
                "
            >

                <img
                    src="${
                        repeat.images?.[0]?.url || ""
                    }"
                >

                <div class="media-info">

                    <div
                        class="media-title"
                    >
                        ${escapeHTML(
                            repeat.name
                        )}
                    </div>

                    <div
                        class="media-subtitle"
                    >
                        ${repeat.items.total}
                        tracks
                    </div>

                </div>

            </div>

        `;


    } catch (error) {

        container.innerHTML =
            "Could not load On Repeat.";

        console.error(error);

    }

}


/* =========================
   USER
========================= */

async function loadProfile() {

    try {

        const data =
            await spotifyFetch(
                "/me"
            );


        document.getElementById(
            "username"
        ).textContent =
            data.display_name ||
            data.id;

    } catch (error) {

        console.error(error);

    }

}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   INITIALIZATION
========================= */

async function initialize() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const code =
        params.get("code");


    if (code) {

        await exchangeCode(code);


        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    }


    const token =
        localStorage.getItem(
            "spotify_access_token"
        );


    if (token) {

        document
            .getElementById("login-screen")
            .classList.add("hidden");


        document
            .getElementById("app-screen")
            .classList.remove("hidden");


        await loadProfile();

        showPage("home");

    }

}


/* LOGIN BUTTON */

document
    .getElementById("spotify-login")
    .addEventListener(
        "click",
        loginSpotify
    );


initialize();
