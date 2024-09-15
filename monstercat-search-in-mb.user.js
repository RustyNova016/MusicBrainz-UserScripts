// ==UserScript==
// @name         Monstercat - Search in Musicbrainz
// @namespace    https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @downloadURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/monstercat-search-in-mb.user.js
// @updateURL    https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/monstercat-search-in-mb.user.js
// @homepageURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @supportURL   https://github.com/RustyNova016/MusicBrainz-UserScripts/issues
// @version      2024-09-15.1
// @description  Add a search button to Monstercat's Release Pages
// @author       You
// @match        https://www.monstercat.com/release/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=monstercat.com
// @grant        none
// ==/UserScript==

async function get_anchor() {
    return waitForElementById("share-release").then(element => element.parentNode)
}

function get_barcode() {
    // We extract the barcode by the URL
    var reg = document.location.href.match(/https:\/\/www\.monstercat\.com\/release\/(.*)/);
    return reg[1];
}

let button;
async function generate_mb_button() {
    var barcode = get_barcode();

    // Create button
    if (button != null) {
        button.remove();
    }

    button = document.createElement("button");
    button.innerHTML = "Search in MB";
    button.setAttribute("class", "btn btn-musicbrainz btn-medium v-align-top ml-xxsmall");
    button.addEventListener("click", () => {
                window.open(`https://musicbrainz.org/search?query=barcode%3A${barcode}&type=release&limit=25&method=advanced`);
            });

    get_anchor().then(element => {

            element.appendChild(button)
    })
}

let button_spotify;
async function generate_spotify_button() {
    var barcode = get_barcode();

    // Create button
    if (button_spotify != null) {
        button_spotify.remove();
    }

    button_spotify = document.createElement("button");
    button_spotify.innerHTML = "Search in spotify";
    button_spotify.setAttribute("class", "btn btn-spotify btn-medium v-align-top ml-xxsmall");
    button_spotify.addEventListener("click", () => {
                window.open(`https://open.spotify.com/search/upc%3A${barcode}`);
            });

    get_anchor().then(element => {

            element.appendChild(button_spotify)
    })
}

// --- Main ---

let globalPromises = []
let form, entity, formString;
let previousUrl = '';

// Do all the logic of a page change
async function onUrlChange() {
    console.log("Url changed!")
    globalPromises.push(generate_mb_button())
    globalPromises.push(generate_spotify_button())
    Promise.all(globalPromises)

}

new MutationObserver(function(mutations) {
    if (location.href != previousUrl) {
        previousUrl = location.href;
        Promise.all(globalPromises).catch(error => {
        }).finally(() => {
            globalPromises = [];
            onUrlChange();
        });
    }
}).observe(document, {subtree: true, childList: true});

// --- Utils ---



// Waits until an element appear on the page. This may never happen, so this may hang!
function waitForElementById(id) {
    return new Promise((resolve, reject) => {
        const mut = new MutationObserver(mutations => {
            const element = document.getElementById(id);
            if (element != null) {
                mut.disconnect();
                resolve(element);
            }
        });
        mut.observe(document.body, {subtree: true, childList: true});
    });
}

// Insert CSS into the Head
function main() {
    let head = document.getElementsByTagName('head')[0];
    if (head) {
        let style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `
            .btn-musicbrainz {
                border-color: rgb(186, 71, 143);
                background-color: rgb(186, 71, 143);
                color: #F1F1F1;
            }

            .btn-spotify {
                margin-top: 5px;
                margin-left: 0px;
                border-color: btn-spotify;
                background-color: #1DD65F;
                color: #F1F1F1;
            }
        `;
        head.appendChild(style);
    }
}
main();

(function() {
    'use strict';

    // Your code here...
})();
