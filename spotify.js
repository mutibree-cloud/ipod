/*
========================================
SPOTIFY CONFIG
========================================
*/

const CLIENT_ID = "0b997ede7ff34bd2be3c4b1135fc3627";


/*
IMPORTANT:
This must EXACTLY match the URL
registered in your Spotify Developer
Dashboard.
*/

const REDIRECT_URI =
    window.location.origin +
    window.location.pathname;


/*
========================================
SPOTIFY PERMISSIONS
========================================
*/

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


/*
========================================
RANDOM STRING
========================================
*/

function generateRandomString(length) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    const values =
        new Uint8Array(length);

    crypto.getRandomValues(values);

    let result = "";

    for (let i = 0; i < length; i++) {

        result +=
            characters[
                values[i] %
                characters.length
            ];

    }

    return result;

}


/*
========================================
BASE64 URL ENCODING
========================================
*/

function base64UrlEncode(buffer) {

    let binary = "";

    const bytes =
        new Uint8Array(buffer);

    for (const byte of bytes) {

        binary +=
            String.fromCharCode(byte);

    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

}


/*
========================================
CREATE PKCE CODE CHALLENGE
========================================
*/

async function generateCodeChallenge(
    verifier
) {

    const data =
        new TextEncoder().encode(
            verifier
        );

    const digest =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return base64UrlEncode(
        digest
    );

}


/*
========================================
LOGIN TO SPOTIFY
========================================
*/

async function loginSpotify() {

    console.log(
        "Spotify login started"
    );

    try {

        /*
        Generate PKCE verifier
        */

        const codeVerifier =
            generateRandomString(128);


        /*
        Generate challenge
        */

        const codeChallenge =
            await generateCodeChallenge(
                codeVerifier
            );


        /*
        Save verifier BEFORE
        leaving the website.
        */

        localStorage.setItem(
            "spotify_code_verifier",
            codeVerifier
        );


        /*
        Generate security state.
        */

        const state =
            generateRandomString(32);


        localStorage.setItem(
            "spotify_state",
            state
        );


        /*
        Create Spotify authorization URL.
        */

        const params =
            new URLSearchParams({

                response_type:
                    "code",

                client_id:
                    CLIENT_ID,

                scope:
                    SCOPES,

                redirect_uri:
                    REDIRECT_URI,

                code_challenge_method:
                    "S256",

                code_challenge:
                    codeChallenge,

                state:
                    state

            });


        const spotifyURL =
            "https://accounts.spotify.com/authorize?" +
            params.toString();


        console.log(
            "Spotify redirect:",
            spotifyURL
        );


        /*
        Send the user to Spotify.
        */

        window.location.href =
            spotifyURL;


    } catch (error) {

        console.error(
            "Spotify login error:",
            error
        );

        alert(
            "Spotify login failed: " +
            error.message
        );

    }

}


/*
========================================
EXCHANGE CODE FOR TOKEN
========================================
*/

async function exchangeCode(code) {

    const verifier =
        localStorage.getItem(
            "spotify_code_verifier"
        );


    if (!verifier) {

        throw new Error(
            "Spotify PKCE verifier is missing."
        );

    }


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

                        client_id:
                            CLIENT_ID,

                        grant_type:
                            "authorization_code",

                        code:
                            code,

                        redirect_uri:
                            REDIRECT_URI,

                        code_verifier:
                            verifier

                    })

            }
        );


    const data =
        await response.json();


    console.log(
        "Spotify token response:",
        response.status,
        data
    );


    if (!response.ok) {

        throw new Error(
            data.error_description ||
            data.error ||
            "Spotify token exchange failed."
        );

    }


    /*
    Save access token.
    */

    localStorage.setItem(
        "spotify_access_token",
        data.access_token
    );


    /*
    Save refresh token.
    */

    if (data.refresh_token) {

        localStorage.setItem(
            "spotify_refresh_token",
            data.refresh_token
        );

    }


    /*
    Save expiration time.
    */

    if (data.expires_in) {

        localStorage.setItem(
            "spotify_token_expires",

            String(
                Date.now() +
                data.expires_in * 1000
            )

        );

    }


    /*
    Clean up verifier.
    */

    localStorage.removeItem(
        "spotify_code_verifier"
    );

}


/*
========================================
REFRESH ACCESS TOKEN
========================================
*/

async function refreshSpotifyToken() {

    const refreshToken =
        localStorage.getItem(
            "spotify_refresh_token"
        );


    if (!refreshToken) {

        throw new Error(
            "No Spotify refresh token available."
        );

    }


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

                        grant_type:
                            "refresh_token",

                        refresh_token:
                            refreshToken,

                        client_id:
                            CLIENT_ID

                    })

            }
        );


    const data =
        await response.json();


    console.log(
        "Spotify refresh response:",
        response.status,
        data
    );


    if (!response.ok) {

        throw new Error(
            data.error_description ||
            data.error ||
            "Spotify token refresh failed."
        );

    }


    localStorage.setItem(
        "spotify_access_token",
        data.access_token
    );


    /*
    Spotify may issue a new
    refresh token.
    */

    if (data.refresh_token) {

        localStorage.setItem(
            "spotify_refresh_token",
            data.refresh_token
        );

    }


    if (data.expires_in) {

        localStorage.setItem(
            "spotify_token_expires",

            String(
                Date.now() +
                data.expires_in * 1000
            )

        );

    }


    return data.access_token;

}


/*
========================================
GET VALID ACCESS TOKEN
========================================
*/

async function getSpotifyAccessToken() {

    const token =
        localStorage.getItem(
            "spotify_access_token"
        );


    if (!token) {

        throw new Error(
            "You are not connected to Spotify."
        );

    }


    const expiration =
        Number(
            localStorage.getItem(
                "spotify_token_expires"
            ) || 0
        );


    /*
    Refresh five minutes before
    expiration.
    */

    if (
        expiration &&
        Date.now() >
        expiration - 300000
    ) {

        return await refreshSpotifyToken();

    }


    return token;

}


/*
========================================
SPOTIFY API REQUEST
========================================
*/

async function spotifyFetch(
    endpoint,
    options = {}
) {

    let token =
        await getSpotifyAccessToken();


    let response =
        await fetch(
            "https://api.spotify.com/v1" +
            endpoint,
            {

                ...options,

                headers: {

                    ...(options.headers || {}),

                    Authorization:
                        `Bearer ${token}`

                }

            }
        );


    /*
    Token may have expired even if
    our expiration time says otherwise.
    */

    if (response.status === 401) {

        token =
            await refreshSpotifyToken();


        response =
            await fetch(
                "https://api.spotify.com/v1" +
                endpoint,
                {

                    ...options,

                    headers: {

                        ...(options.headers || {}),

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );

    }


    const text =
        await response.text();


    console.log(
        "Spotify API response:",
        response.status,
        endpoint,
        text
    );


    if (!response.ok) {

        let message =
            `Spotify API error ${response.status}`;


        try {

            const errorData =
                JSON.parse(text);


            if (
                errorData.error?.message
            ) {

                message +=
                    `: ${errorData.error.message}`;

            }

            else if (
                errorData.error
            ) {

                message +=
                    `: ${errorData.error}`;

            }

        } catch {

            if (text) {

                message +=
                    `: ${text}`;

            }

        }


        throw new Error(
            message
        );

    }


    if (!text) {

        return {};

    }


    return JSON.parse(text);

}


/*
========================================
GET PROFILE
========================================
*/

async function getSpotifyProfile() {

    return await spotifyFetch(
        "/me"
    );

}


/*
========================================
GET SAVED MUSIC
========================================
*/

async function getSavedTracks(
    limit = 20,
    offset = 0
) {

    return await spotifyFetch(
        `/me/tracks?limit=${limit}&offset=${offset}`
    );

}


/*
========================================
GET SAVED PODCASTS
========================================
*/

async function getSavedShows(
    limit = 20,
    offset = 0
) {

    return await spotifyFetch(
        `/me/shows?limit=${limit}&offset=${offset}`
    );

}


/*
========================================
GET PLAYLISTS
========================================
*/

async function getUserPlaylists(
    limit = 50,
    offset = 0
) {

    return await spotifyFetch(
        `/me/playlists?limit=${limit}&offset=${offset}`
    );

}


/*
========================================
GET PLAYLIST ITEMS
========================================
*/

async function getPlaylistItems(
    playlistId,
    limit = 50,
    offset = 0
) {

    return await spotifyFetch(
        `/playlists/${playlistId}/items?limit=${limit}&offset=${offset}`
    );

}


/*
========================================
RECENTLY PLAYED
========================================
*/

async function getRecentlyPlayed(
    limit = 20
) {

    return await spotifyFetch(
        `/me/player/recently-played?limit=${limit}`
    );

}


/*
========================================
CURRENT PLAYBACK
========================================
*/

async function getCurrentlyPlaying() {

    return await spotifyFetch(
        "/me/player"
    );

}


/*
========================================
SEARCH SPOTIFY
========================================
*/

async function searchSpotify(
    query,
    types = "track,album,artist,playlist,show",
    limit = 20
) {

    const params =
        new URLSearchParams({

            q: query,

            type: types,

            limit: limit

        });


    return await spotifyFetch(
        `/search?${params.toString()}`
    );

}


/*
========================================
CHECK CONNECTION
========================================
*/

function isSpotifyConnected() {

    return !!localStorage.getItem(
        "spotify_access_token"
    );

}


/*
========================================
HANDLE SPOTIFY CALLBACK
========================================
*/

async function handleSpotifyCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const code =
        params.get("code");


    const state =
        params.get("state");


    const error =
        params.get("error");


    /*
    Spotify returned an error.
    */

    if (error) {

        throw new Error(
            `Spotify authorization failed: ${error}`
        );

    }


    /*
    Nothing to process.
    */

    if (!code) {

        return false;

    }


    /*
    Verify state.
    */

    const savedState =
        localStorage.getItem(
            "spotify_state"
        );


    if (
        savedState &&
        state !== savedState
    ) {

        throw new Error(
            "Spotify security verification failed."
        );

    }


    /*
    Exchange authorization code.
    */

    await exchangeCode(code);


    /*
    Remove state.
    */

    localStorage.removeItem(
        "spotify_state"
    );


    /*
    Remove ?code=... from address.
    */

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );


    return true;

}


/*
========================================
TEST CONNECTION
========================================
*/

async function testSpotifyConnection() {

    const profile =
        await getSpotifyProfile();


    console.log(
        "Spotify connection successful:",
        profile
    );


    return profile;

}


/*
========================================
LOG OUT
========================================
*/

function logoutSpotify() {

    localStorage.removeItem(
        "spotify_access_token"
    );

    localStorage.removeItem(
        "spotify_refresh_token"
    );

    localStorage.removeItem(
        "spotify_token_expires"
    );

    localStorage.removeItem(
        "spotify_code_verifier"
    );

    localStorage.removeItem(
        "spotify_state"
    );


    window.location.href =
        window.location.origin +
        window.location.pathname;

}
