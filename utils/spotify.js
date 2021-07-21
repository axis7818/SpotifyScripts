const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
});

let access = null;

const config = {
	clientId: process.env.SPOTIFY_CLIENT_ID,
	clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
	scopes: [
		'user-read-email',
		'user-library-read',
		'user-library-modify',
	],
};
const redirect_uri = 'http://localhost/';

function buildAuthorizeUrl() {
	const authorizeUrl = new URL(`https://accounts.spotify.com/authorize`);
	authorizeUrl.searchParams.append('response_type', 'code');
	authorizeUrl.searchParams.append('client_id', config.clientId);
	authorizeUrl.searchParams.append('scope', encodeURIComponent(config.scopes.join(' ')));
	authorizeUrl.searchParams.append('redirect_uri', redirect_uri);
	return authorizeUrl;
}

function getOauthCode() {
	const authorizeUrl = buildAuthorizeUrl();
	console.log(`Click this authorization URL: ${authorizeUrl.toString()}`);

	return new Promise((resolve) => {
		readline.question("Enter the authorization code: ", codeUrl => {
			resolve(codeUrl.trim());
			readline.close();
		});
	});
}

function getAccessToken(code) {
	const Authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;
	return axios.post('https://accounts.spotify.com/api/token',
		querystring.stringify({
			grant_type: 'authorization_code',
			code,
			redirect_uri,
		}),
		{
			headers: {
				Authorization,
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		},
	).then((response) => {
		if (response.status !== 200) {
			throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
		}
		access = response.data;
		return response.data;
	});
}

const accessPath = 'access.json';
function loadCachedAccessToken() {
	if (fs.existsSync(accessPath)) {
		const accessString = fs.readFileSync(accessPath);
		access = JSON.parse(accessString);
	}
}

function cacheAccessToken() {
	fs.writeFileSync(accessPath, JSON.stringify(access));
}

function authorize() {
	loadCachedAccessToken();
	if (access === null) {
		console.log("requesting access token");
		return getOauthCode()
			.then(getAccessToken)
			.then(cacheAccessToken);
	} else {
		console.log("using cached access token");
		return Promise.resolve();
	}
}

function getUserInfo() {
	return axios.get('https://api.spotify.com/v1/me', {
		headers: {
			Authorization: `Bearer ${access.access_token}`,
		},
	}).then((response) => {
		console.log(response.data);
	});
}

function getUserSavedAlbums(nextUrl) {
	console.log(`Fetching albums ${nextUrl}`);
	return axios.get(nextUrl || 'https://api.spotify.com/v1/me/albums',
		{
			headers: {
				Authorization: `Bearer ${access.access_token}`,
			}
		},
	).then((response) => {
		return response.data;
	});
}

function saveTracksForUser(tracks) {
	const ids = tracks.map(track => track.id);
	return axios.put('https://api.spotify.com/v1/me/tracks', { ids },
		{
			headers: {
				Authorization: `Bearer ${access.access_token}`,
				'Content-Type': 'application/json',
			},
		},
	).then(response => {
		if (response.status !== 200) {
			throw new Error(`Failed to like all songs in album: ${response.status} ${response.statusText}`);
		}
	});
}

module.exports = {
	authorize,
	getUserInfo,
	getUserSavedAlbums,
	saveTracksForUser,
};
