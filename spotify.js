/*
========================================
SPOTIFY CONFIGURATION
========================================
*/

const CLIENT_ID = "0b997ede7ff34bd2be3c4b1135fc3627";

const REDIRECT_URI =
    window.location.origin +
    window.location.pathname;


/*
========================================
PERMISSIONS
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
PKCE HELPERS
========================================
*/

function generateRandomString(length = 128) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    let result = "";

    const randomValues =
        new Uint8Array(length);

    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {

        result +=
            characters[
                randomValues[i] %
                characters.length
            ];

    }

    return result;
}


async function generateCodeChallenge(verifier) {

    const data =
        new TextEncoder().encode(verifier);

    const digest =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return base64UrlEncode(digest);
}


function base64UrlEncode(buffer) {

    let binary = "";

    const bytes =
        new Uint8Array(buffer);

    bytes.forEach(byte => {

        binary += String.fromCharCode(byte);

    });

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


/*
========================================
LOGIN
========================================
*/

async function loginSpotify() {

    try {

        const codeVerifier =
            generateRandomString();


        const codeChallenge =
            await generateCodeChallenge(
                codeVerifier
            );


        /*
        Save verifier so we can use it
        after Spotify redirects back.
        */

        sessionStorage.setItem(
            "spotify_code_verifier",
            codeVerifier
        );


        /*
        Create a state value for
        authorization security.
        */

        const state =
            generateRandomString(32);


        sessionStorage.setItem(
            "spotify_state",
            state
        );


        const params =
            new URLSearchParams({

                response_type: "code",

                client_id: CLIENT_ID,

                scope: SCOPES,

                redirect_uri: REDIRECT_URI,

                code_challenge_method: "S256",

                code_challenge: codeChallenge,

                state: state

            });


        window.location.href =
            "https://accounts.spotify.com/authorize?" +
            params.toString();


    } catch (error) {

        console.error(
            "Spotify login error:",
            error
        );

        alert(
            "Could not start Spotify login."
        );

    }

}


/*
========================================
EXCHANGE AUTHORIZATION CODE
========================================
*/

async function exchangeCode(code) {

    const verifier =
        sessionStorage.getItem(
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

                        grant_type:
                            "authorization_code",

                        code: code,

                        redirect_uri:
                            REDIRECT_URI,

                        client_id:
                            CLIENT_ID,

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
            "Spotify authorization failed."
        );

    }


    /*
    Store tokens.
    */

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


    /*
    Spotify access tokens normally last
    about one hour.
    */

    if (data.expires_in) {

        const expiration =
            Date.now() +
            (data.expires_in * 1000);

        localStorage.setItem(
            "spotify_token_expires",
            expiration
        );

    }


    sessionStorage.removeItem(
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
            "No Spotify refresh token."
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
        "Spotify refresh:",
        response.status,
        data
    );


    if (!response.ok) {

        /*
        Refresh token expired or became invalid.
        Spotify requires reauthorization in this case.
        */

        logoutSpotify();

        throw new Error(
            "Spotify authorization expired. Please reconnect."
        );

    }


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


    if (data.expires_in) {

        const expiration =
            Date.now() +
            (data.expires_in * 1000);

        localStorage.setItem(
            "spotify_token_expires",
            expiration
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
            "Not connected to Spotify."
        );

    }


    const expiration =
        Number(
            localStorage.getItem(
                "spotify_token_expires"
            ) || 0
        );


    /*
    Refresh if the token is expired
    or will expire within 5 minutes.
    */

    if (
        expiration &&
        Date.now() >
        expiration - (5 * 60 * 1000)
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

async function spotifyFetch(endpoint, options = {}) {

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
    If token expired unexpectedly,
    refresh and retry once.
    */

    if (response.status === 401) {

        try {

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

        } catch (error) {

            throw error;

        }

    }


    const responseText =
        await response.text();


    console.log(
        "Spotify API:",
        response.status,
        endpoint,
        responseText
    );


    if (!response.ok) {

        let errorMessage =
            `Spotify API error ${response.status}`;


        try {

            const errorData =
                JSON.parse(responseText);


            if (
                errorData.error?.message
            ) {

                errorMessage +=
                    `: ${errorData.error.message}`;

            }

        } catch {

            if (responseText) {

                errorMessage +=
                    `: ${responseText}`;

            }

        }


        throw new Error(
            errorMessage
        );

    }


    if (!responseText) {

        return {};

    }


    return JSON.parse(
        responseText
    );

}


/*
========================================
GET CURRENT USER
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
GET USER PLAYLISTS
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

IMPORTANT:
Spotify changed this endpoint in 2026.

OLD:
 /playlists/{id}/tracks

NEW:
 /playlists/{id}/items
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
GET RECENTLY PLAYED
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
GET CURRENT PLAYBACK
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

    const encodedQuery =
        encodeURIComponent(query);


    const encodedTypes =
        encodeURIComponent(types);


    return await spotifyFetch(
        `/search?q=${encodedQuery}&type=${encodedTypes}&limit=${limit}`
    );

}


/*
========================================
DISCONNECT SPOTIFY
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

    sessionStorage.removeItem(
        "spotify_code_verifier"
    );

    sessionStorage.removeItem(
        "spotify_state"
    );


    /*
    Return to the app without
    Spotify's authorization code.
    */

    window.location.href =
        window.location.origin +
        window.location.pathname;

}


/*
========================================
CHECK LOGIN
========================================
*/

function isSpotifyConnected() {

    return !!localStorage.getItem(
        "spotify_access_token"
    );

}


/*
========================================
PROCESS SPOTIFY CALLBACK
========================================
*/

async function handleSpotifyCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const code =
        params.get("code");


    const returnedState =
        params.get("state");


    const error =
        params.get("error");


    /*
    User denied Spotify access.
    */

    if (error) {

        console.error(
            "Spotify authorization error:",
            error
        );


        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );


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
    Check state.
    */

    const savedState =
        sessionStorage.getItem(
            "spotify_state"
        );


    if (
        savedState &&
        returnedState !== savedState
    ) {

        throw new Error(
            "Spotify security check failed."
        );

    }


    await exchangeCode(code);


    sessionStorage.removeItem(
        "spotify_state"
    );


    /*
    Remove ?code=... from URL.
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
TEST SPOTIFY CONNECTION
========================================
*/

async function testSpotifyConnection() {

    try {

        const profile =
            await getSpotifyProfile();


        console.log(
            "Spotify connection successful:",
            profile
        );


        return profile;

    } catch (error) {

        console.error(
            "Spotify connection failed:",
            error
        );


        throw error;

    }

}
