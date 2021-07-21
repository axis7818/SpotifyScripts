#!/usr/bin/env node

require('dotenv').config();

const spotify = require('../utils/spotify');

const SLEEP_MS = 20;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function likeAllAlbumSongs() {
	let nextUrl = undefined;
	do {
		const albumPage = await spotify.getUserSavedAlbums(nextUrl);
		for (let index = 0; index < albumPage.items.length; index += 1) {
			const album = albumPage.items[index].album;
			await likeAllSongs(album, index + albumPage.offset, albumPage.total);
		}
		nextUrl = albumPage.next;
	} while (nextUrl);
}

async function likeAllSongs(album, index, total) {
	console.log(`${index + 1}/${total} | ${album.name}`);

	const tracks = album.tracks;
	do {
		await spotify.saveTracksForUser(tracks.items);
		await sleep(SLEEP_MS);
		// TODO: get the next page of tracks

		if (tracks.next) {
			console.log(album);
			throw new Error(`Album has more tracks that weren't liked`);
		}
	} while (tracks.next);
}

spotify.authorize()
	.then(likeAllAlbumSongs)
	.then(() => {
		console.log("done");
		process.exit();
	})
	.catch(err => {
		console.error(JSON.stringify(err));
		process.exit(1);
	});
