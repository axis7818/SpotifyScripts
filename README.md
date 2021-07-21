# SpotifyScripts

miscellaneous spotify scripts

## Usage

```sh
# clone the repository
git clone https://github.com/axis7818/SpotifyScripts.git
cd SpotifyScripts

# install dependencies
yarn install

# configure environment variables
cp example.env .env 
vim .env

# run scripts
yarn like-all-album-songs
```

To authenticate with spotify, open the prompted URL to login and grant permissions in the browser.
Once done, the browser will be redirected to: `http://localhost/?code=<ACCESS_CODE>`.
Copy the `<ACCESS_CODE>` and paste it in the prompt.
This code is saved to `access.json` for future runs.

To force a reauthentication, delete `access.json`.

