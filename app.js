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

    if (!page) return;

    page.classList.remove("hidden");

    currentPage =
        pages.indexOf(pageName);

    const title =
        document.getElementById("page-title");

    if (title) {
        title.textContent = pageName;
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


/* =========================
   PAGE BUTTONS
========================= */

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
        currentPage = pages.length - 1;
    }

    showPage(
        pages[currentPage]
    );
}


/* =========================
   DISPLAY ERROR
========================= */

function displaySpotifyError(
    container,
    title,
    error
) {

    console.error(
        title,
        error
    );

    container.innerHTML = `

        <div class="spotify-error">

            <p>
                ${escapeHTML(title)}
            </p>

            <small>
                ${escapeHTML(
                    error?.message ||
                    "Unknown Spotify error."
                )}
            </small>

        </div>

    `;
}


/* =========================
   MUSIC
========================= */

async function loadMusic() {

    const container =
        document.getElementById(
            "music-list"
        );

    if (!container) return;

    container.innerHTML =
        "Loading music...";


    try {

        const data =
            await spotifyFetch(
                "/me/tracks?limit=20"
            );


        container.innerHTML = "";


        if (
            !data.items ||
            data.items.length === 0
        ) {

            container.innerHTML =
                "You don't have any saved music.";

            return;
        }


        data.items.forEach(item => {

            const track =
                item.track;

            if (!track) return;


            const image =
                track.album?.images?.[2]?.url ||
                track.album?.images?.[0]?.url ||
                "";


            const artists =
                track.artists
                    ?.map(
                        artist =>
                            artist.name
                    )
                    .join(", ") ||
                "";


            container.innerHTML += `

                <div class="media-item">

                    <img
                        src="${image}"
                        alt=""
                    >

                    <div class="media-info">

                        <div class="media-title">

                            ${escapeHTML(
                                track.name
                            )}

                        </div>

                        <div class="media-subtitle">

                            ${escapeHTML(
                                artists
                            )}

                        </div>

                    </div>

                </div>

            `;

        });


    } catch (error) {

        displaySpotifyError(
            container,
            "Could not load your music.",
            error
        );

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

    if (!container) return;


    container.innerHTML =
        "Loading podcasts...";


    try {

        const data =
            await spotifyFetch(
                "/me/shows?limit=20"
            );


        container.innerHTML = "";


        if (
            !data.items ||
            data.items.length === 0
        ) {

            container.innerHTML =
                "You don't have any saved podcasts.";

            return;
        }


        data.items.forEach(item => {

            const show =
                item.show;

            if (!show) return;


            const image =
                show.images?.[2]?.url ||
                show.images?.[0]?.url ||
                "";


            container.innerHTML += `

                <div class="media-item">

                    <img
                        src="${image}"
                        alt=""
                    >

                    <div class="media-info">

                        <div class="media-title">

                            ${escapeHTML(
                                show.name
                            )}

                        </div>

                        <div class="media-subtitle">

                            Podcast

                        </div>

                    </div>

                </div>

            `;

        });


    } catch (error) {

        displaySpotifyError(
            container,
            "Could not load podcasts.",
            error
        );

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

    if (!container) return;


    container.innerHTML =
        "Loading playlists...";


    try {

        const data =
            await spotifyFetch(
                "/me/playlists?limit=50"
            );


        container.innerHTML = "";


        if (
            !data.items ||
            data.items.length === 0
        ) {

            container.innerHTML =
                "You don't have any playlists.";

            return;
        }


        data.items.forEach(playlist => {

            const image =
                playlist.images?.[2]?.url ||
                playlist.images?.[0]?.url ||
                "";


            const itemCount =
                playlist.items?.total ??
                0;


            const spotifyURL =
                playlist.external_urls?.spotify ||
                "#";


            container.innerHTML += `

                <div
                    class="media-item"
                    onclick="
                        window.open(
                            '${spotifyURL}',
                            '_blank'
                        )
                    "
                >

                    <img
                        src="${image}"
                        alt=""
                    >

                    <div class="media-info">

                        <div class="media-title">

                            ${escapeHTML(
                                playlist.name
                            )}

                        </div>

                        <div class="media-subtitle">

                            ${itemCount} items

                        </div>

                    </div>

                </div>

            `;

        });


    } catch (error) {

        displaySpotifyError(
            container,
            "Could not load playlists.",
            error
        );

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

    if (!container) return;


    container.innerHTML =
        "Looking for On Repeat...";


    try {

        const data =
            await spotifyFetch(
                "/me/playlists?limit=50"
            );


        const repeat =
            data.items?.find(
                playlist =>
                    playlist.name
                        ?.toLowerCase()
                        .includes("on repeat")
            );


        if (!repeat) {

            container.innerHTML = `

                <p>
                    I couldn't find your
                    On Repeat playlist.
                </p>

            `;

            return;
        }


        const image =
            repeat.images?.[0]?.url ||
            "";


        const itemCount =
            repeat.items?.total ??
            0;


        const spotifyURL =
            repeat.external_urls?.spotify ||
            "#";


        container.innerHTML = `

            <div
                class="media-item"
                onclick="
                    window.open(
                        '${spotifyURL}',
                        '_blank'
                    )
                "
            >

                <img
                    src="${image}"
                    alt=""
                >

                <div class="media-info">

                    <div class="media-title">

                        ${escapeHTML(
                            repeat.name
                        )}

                    </div>

                    <div class="media-subtitle">

                        ${itemCount} tracks

                    </div>

                </div>

            </div>

        `;


    } catch (error) {

        displaySpotifyError(
            container,
            "Could not load On Repeat.",
            error
        );

    }

}


/* =========================
   USER PROFILE
========================= */

async function loadProfile() {

    try {

        const data =
            await spotifyFetch(
                "/me"
            );


        const username =
            document.getElementById(
                "username"
            );


        if (username) {

            username.textContent =
                data.display_name ||
                data.id ||
                "Spotify";

        }


    } catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

    }

}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   INITIALIZATION
========================= */

async function initialize() {

    try {

        /*
        Handle Spotify's
        authorization callback.
        */

        await handleSpotifyCallback();


        /*
        Check whether we have
        a Spotify login.
        */

        if (!isSpotifyConnected()) {

            document
                .getElementById(
                    "login-screen"
                )
                ?.classList.remove(
                    "hidden"
                );

            document
                .getElementById(
                    "app-screen"
                )
                ?.classList.add(
                    "hidden"
                );

            return;
        }


        /*
        Verify the token actually works.
        */

        await testSpotifyConnection();


        /*
        Spotify connection works.
        */

        document
            .getElementById(
                "login-screen"
            )
            ?.classList.add(
                "hidden"
            );


        document
            .getElementById(
                "app-screen"
            )
            ?.classList.remove(
                "hidden"
            );


        await loadProfile();

        showPage("home");


    } catch (error) {

        console.error(
            "APP INITIALIZATION ERROR:",
            error
        );


        /*
        Don't silently destroy the session.
        Show the error so we can diagnose it.
        */

        const loginScreen =
            document.getElementById(
                "login-screen"
            );


        if (loginScreen) {

            loginScreen.classList.remove(
                "hidden"
            );

        }


        const appScreen =
            document.getElementById(
                "app-screen"
            );


        if (appScreen) {

            appScreen.classList.add(
                "hidden"
            );

        }


        console.error(
            "FULL SPOTIFY ERROR:",
            error.message
        );

    }

}


/* =========================
   LOGIN BUTTON
========================= */

const loginButton =
    document.getElementById(
        "spotify-login"
    );


if (loginButton) {

    loginButton.addEventListener(
        "click",
        loginSpotify
    );

}


/* =========================
   START
========================= */

initialize();
