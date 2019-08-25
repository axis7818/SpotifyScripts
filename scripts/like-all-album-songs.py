
import click
import spotipy
import spotipy.util as util
import time

ALBUM_REQUEST_LIMIT = 50
SPOTIFY_CLIENT_SCOPE = 'user-library-read user-library-modify'


def get_spotify_client(username=None, client_id=None, client_secret=None):
    token = util.prompt_for_user_token(
        username,
        SPOTIFY_CLIENT_SCOPE,
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri='http://localhost/'
    )
    spotify = spotipy.Spotify(auth=token)
    return spotify


def get_all_albums(spotify, offset=None):
    batch = spotify.current_user_saved_albums(limit=ALBUM_REQUEST_LIMIT,
                                              offset=offset)
    albums = batch.get('items')
    if batch.get('next'):
        next_albums = get_all_albums(
            spotify, offset=batch.get('offset') + batch.get('limit'))
        albums = albums + next_albums
    return albums


def like_all_songs_for_album(spotify, album):
    try:
        album = album.get('album')
        print("{} - {}".format(
            album.get('artists')[0].get('name'),
            album.get('name')
        ))

        tracks = album.get('tracks').get('items')
        i = 0
        for track in tracks:
            i += 1
            print('  {}: "{}"'.format(i, track.get('name')))
        track_ids = list(map(lambda t: t.get('id'), tracks))
        spotify.current_user_saved_tracks_add(track_ids)
    except Exception as e:
        print("ERROR: {}".format(e))


@click.command()
@click.option('--username', '-u', envvar="SPOTIFY_USERNAME", required=True)
@click.option('--client-id', '-c', envvar="SPOTIFY_CLIENT_ID", required=True)
@click.option('--client-secret', '-s', envvar="SPOTIFY_CLIENT_SECRET",
              required=True)
def like_all_album_songs(username, client_id, client_secret):
    spotify = get_spotify_client(username=username, client_id=client_id,
                                 client_secret=client_secret)

    print("Getting albums")
    albums = get_all_albums(spotify)
    print("Found {} albums".format(len(albums)))
    time.sleep(1)

    for album in albums:
        like_all_songs_for_album(spotify, album)
        time.sleep(1)


if __name__ == '__main__':
    like_all_album_songs()
