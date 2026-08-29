const CLIENT_ID = "0b997ede7ff34bd2be3c4b1135fc3627";

const REDIRECT_URI =
    window.location.origin +
    window.location.pathname;

const SCOPES = [
    "user-read-private",
    "user-read-email",
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
].join(" ");


/* =========================
   PKCE
========================= */

function randomString(length) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {

        result += characters.charAt(
            Math.floor(
                Math.random() *
                characters.length
            )
        );

    }

    return result;
}


async function sha256(plain) {

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(plain);

    return window.crypto.subtle.digest(
        "SHA-256",
        data
    );
}


function base64urlencode(input) {

    return btoa(
        String.fromCharCode(
            ...new Uint8Array(input)
        )
    )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


/* =========================
   LOGIN
========================= */

async function loginSpotify() {

    const codeVerifier =
        randomString(128);

    const hashed =
        await sha256(codeVerifier);

    const codeChallenge =
        base64urlencode(hashed);

    localStorage.setItem(
        "spotify_code_verifier",
        codeVerifier
    );


    const authUrl =
        new URL(
            "https://accounts.spotify.com/authorize"
        );


    authUrl.search =
        new URLSearchParams({

            response_type: "code",

            client_id: CLIENT_ID,

            scope: SCOPES,

            code_challenge_method: "S256",

            code_challenge: codeChallenge,

            redirect_uri: REDIRECT_URI

        });


    window.location.href =
        authUrl.toString();
}


/* =========================
   TOKEN
========================= */

async function exchangeCode(code) {

    const verifier =
        localStorage.getItem(
            "spotify_code_verifier"
        );


    const response =
        await fetch(
            "https://accounts.spotify.com/api/token",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    new URLSearchParams({

                        client_id: CLIENT_ID,

                        grant_type:
                            "authorization_code",

                        code: code,

                        redirect_uri:
                            REDIRECT_URI,

                        code_verifier:
                            verifier

                    })

            }
        );


    const data =
        await response.json();


    if (data.access_token) {

        localStorage.setItem(
            "spotify_access_token",
            data.access_token
        );

        if (data.refresh_token) {

            localStorage.setItem(
                "spotify_refresh_token",
                data.refresh_token
            );

        }

    }


    return data;
}


/* =========================
   API
========================= */

async function spotifyFetch(endpoint) {

    const token =
        localStorage.getItem(
            "spotify_access_token"
        );


    const response =
        await fetch(
            "https://api.spotify.com/v1" +
            endpoint,
            {

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }
        );


    if (response.status === 401) {

        localStorage.removeItem(
            "spotify_access_token"
        );

        throw new Error(
            "Spotify session expired."
        );

    }


    if (!response.ok) {

        throw new Error(
            `Spotify error: ${response.status}`
        );

    }


    return response.json();
}
