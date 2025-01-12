// ==UserScript==
// @name         Search Missing Data
// @namespace    http://tampermonkey.net/
// @version      2025-01-12.1
// @description  Add linksto listenbrainz's missing data page
// @author       You
// @match        https://listenbrainz.org/settings/link-listens/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=listenbrainz.org
// @namespace    https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @downloadURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/listenbrainz-search-missing-data.user.js
// @updateURL    https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/listenbrainz-search-missing-data.user.js
// @homepageURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @supportURL   https://github.com/RustyNova016/MusicBrainz-UserScripts/issues
// @grant        none
// ==/UserScript==
'use strict';

let global_albums = new Map();
let running_update = false;
let schedule_update = false;

let globalPromises = []
let form, entity, formString;
let previousAlbumCount = 0;

// Spotify integration variables
let card_root_class_name = "bEHVkp"; // Change every CSS refresh.

new MutationObserver(function(mutations) {
    // Prevent running if there's already an update in progress
    if (running_update) {
        schedule_update = true
        return
    }
    running_update = true
    on_mutation();

    // If an update got scheduled, then rerun
    if (schedule_update) {
        on_mutation();
    }

    // Remove running lock
    running_update = false
}).observe(document, {subtree: true, childList: true});


function on_mutation() {
    globalPromises.push(get_all_cards())
    Promise.all(globalPromises)
}

async function get_all_cards() {
    let all_cards = document.getElementsByClassName("card listen-card");

    if (all_cards.length === 0) {
        console.log("[MB Status] No cards found. If you expect some, the CSS might have changed.");
        return
    }

    console.log("[MB Status] card count: " + all_cards.length)
    if (all_cards.length === 0) {return}

    console.log(all_cards);

    for (const card of all_cards) {
        await handle_card(card);
    }
}

function get_title_from_root(card_root) {
    return card_root.childNodes[0].childNodes[0].childNodes[0].childNodes[0].innerHTML
}

function get_artist_from_root(card_root) {
    return card_root.childNodes[0].childNodes[0].childNodes[1].innerHTML
}

function get_anchor(card_root){
    return card_root.childNodes[0].childNodes[1]
}

function is_card_anchored(card_root) {
    return card_root.childNodes[0].childNodes[1].childNodes[0].classList[0] === "search-link-container"
}

function is_data_loaded(card_root) {
    return card_root.childNodes[0].childNodes[1] !== undefined && card_root.childNodes[0].childNodes[0].childNodes[1] !== undefined
}

async function handle_card(card_root) {
    if (!is_data_loaded(card_root) || is_card_anchored(card_root)) {
        // No data! Let's bail
        return;
    }
    // Let's get the title.
    let title = get_title_from_root(card_root);
    console.log(`Title: ${title}`);

    let artist = get_artist_from_root(card_root);
    console.log(`artist: ${artist}`);

    let anchor = get_anchor(card_root);

    let container = document.createElement("div");
    container.setAttribute("class", "search-link-container");
    anchor.prepend(container);

    add_icon(container, `https://musicbrainz.org/taglookup/index?tag-lookup.artist=${artist}&tag-lookup.track=${title}`, "musicbrainz");
    add_icon(container, `https://listenbrainz.org/search/?search_term=${title} ${artist}&search_type=track`, "listenbrainz");
    add_icon(container, `https://open.spotify.com/search/${title} ${artist}`, "spot");
    add_icon(container, `https://www.deezer.com/search/${title} ${artist}`, "deez");
    add_icon(container, `https://music.apple.com/gb/search?term=${title} ${artist}`, "apple");
}

function add_icon(container, link, pref) {
    let icon = document.createElement("a");
    icon.href = link
    icon.setAttribute("class", `search-link ${pref}-search-icon`);
    icon.target="_blank";
    container.append(icon);
}

// Insert CSS into the Head
function main() {
    let head = document.getElementsByTagName('head')[0];
    if (head) {
        let style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `


        .search-link-container{
            display: flex;
            padding: 0px 10px
        }

        .search-link {
            margin: 0px 5px;
              background: 0 0 no-repeat;
    background-image: none;
    background-size: auto;
  background-size: 32px;
  width: 32px;
  height: 32px;
        }



        .spot-search-icon {
  background-image: url("https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png") !important;
        }

                .deez-search-icon {
  background-image: url("https://e-cdn-files.dzcdn.net/cache/images/common/favicon/favicon-32x32.ed120c279a693bed3a44.png") !important;
        }

        .apple-search-icon {
  background-image: url("https://www.google.com/s2/favicons?sz=64&domain=music.apple.com") !important;
        }

        .listenbrainz-search-icon {
  background-image: url("https://www.google.com/s2/favicons?sz=64&domain=listenbrainz.org") !important;
        }
                .musicbrainz-search-icon {
  background-image: url("https://www.google.com/s2/favicons?sz=64&domain=musicbrainz.org") !important;
        }
        `;
        head.appendChild(style);
    }
}
main();
