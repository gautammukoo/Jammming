const clientId = '5388770b39c2450ab6dea1abb890e20c';
const redirectUri = 'http://excellent-stretch.surge.sh';
let accessToken;
let expiresIn;

const Spotify = {
    getAccessToken() {
        if(accessToken) {
            return accessToken;
        }
    
        //check for an access token match(to get in the URL)
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if(accessTokenMatch && expiresInMatch)
        {
            accessToken = accessTokenMatch[1];
            expiresIn = Number[expiresInMatch[1]];
            
            //This clears the params, allowing us to grab a new access token when it expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, 
        { headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if(!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },

    savePlaylist(playlistName, trackUris) {
        this.getAccessToken();
        let userID;
        let playlistID;

        if (playlistName && trackUris) {
            //Retreive a user's ID from the Spotify API
            return fetch(`https://api.spotify.com/v1/me`, {
                headers: {Authorization: `Bearer ${accessToken}`}
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Request Failed!');
            }, networkError => console.log(networkError.message)
            ).then(jsonResponse => {
                userID =jsonResponse.id;

            //Add tracks to newly created playlist
            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
                headers: {'Content-type': `application/json`,
                Authorization: `Bearer ${accessToken}`},
                method: 'POST',
                body: JSON.stringify({name: playlistName})
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Request Failed!');
            }, networkError => console.log(networkError.message)
            ).then(jsonResponse => {
                playlistID = jsonResponse.id;

            //Create a new playlist on the user's Spotify account and save the playlist's ID
            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
                headers: {Authorization: `Bearer ${accessToken}`,
                'Content-type': 'application/json'},
                method: 'POST',
                body: JSON.stringify({uri: trackUris})
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Request Failed!');
            }, networkError => console.log(networkError.message)
            ).then(jsonResponse => {
                console.log(jsonResponse.snapshot_id);
            });
            });
        });
    }
}
} 

export default Spotify;