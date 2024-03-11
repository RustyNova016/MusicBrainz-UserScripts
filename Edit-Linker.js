// ==UserScript==
// @name         Edit Linker
// @namespace    http://tampermonkey.net/
// @version      2024-03-11
// @description  Add link to search musicbrainz entities on mutlple sites
// @author       RustyNova
// @match        *://*.musicbrainz.org/recording/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @namespace   https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @downloadURL https://raw.githubusercontent.com/RustyNova016/MusicBrainz-UserScripts/main/spotify-musicbrainz-import.js
// @updateURL   https://raw.githubusercontent.com/RustyNova016/MusicBrainz-UserScripts/main/spotify-musicbrainz-import.js
// @homepageURL https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @supportURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/issues
// @grant        none
// ==/UserScript==
'use strict';

// The list of links to add buttons for
let links = [
    {
        text: "Soundcloud",
        link: (page_data) => `https://soundcloud.com/search?q=${page_data.recordingName} ${page_data.artistCredit}`,
        color: "#f50",
        favicon: "https://a-v2.sndcdn.com/assets/images/sc-icons/favicon-2cadd14bdb.ico"
    },
    {
        text: "Spotify",
        link: (page_data) => `https://open.spotify.com/search/${page_data.recordingName} ${page_data.artistCredit}`,
        color: "#18c155",
        favicon: "https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png"
    },
    {
        text: "Youtube",
        link: (page_data) => `https://www.youtube.com/results?search_query=${page_data.recordingName} ${page_data.artistCredit}`,
        color: "#dd2c00",
        favicon: "https://www.youtube.com/s/desktop/4fdfe272/img/favicon_32x32.png"
    },
]

// The list of elements to anchor the buttons on
let anchors = [
    {
        target: document.querySelector("#external-links-editor-container"),
        after:  waitForElement("#external-links-editor")
    }
]

// All the functions that ask for "page_data" will recieve this object. The fields may or may not be filled depending on the page

let data = {
    // The name of the recording
    recordingName: "",

    // The artist credit
    artistCredit: ""
}

// Insert CSS into the Head
function main() {
    let head = document.getElementsByTagName('head')[0];
    if (head) {
        let style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `
        .dashbox {
            padding-bottom: 4px;
        }

        .button-area {
            display: flex;
            padding: 12px
        }

        .button-favicon {
            height: 1.25em;
            margin-left: 5px;
        }

        .search-button {
            border-radius: 5px;
            border: none;
            padding: 10px;
            font-size: 1em;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            text-decoration: inherit; /* no underline */
            margin: 6px
        }

        .search-button:hover {text-decoration: inherit; color: inherit;}
        .search-button:visited {text-decoration: inherit; color: white;}

        .search-button:before {
            background-image: url("https://a-v2.sndcdn.com/assets/images/sc-icons/favicon-2cadd14bdb.ico");
            background-size: 14px 14px;
        }
        `;
        head.appendChild(style);
    }
}
main();


// ==============================================================================================
// Beware! Beyond this point lies code! If you aren't a programmer, you may want to turn back!
// ==============================================================================================

let globalPromises = []
let form, entity, formString;
let previousUrl = '';

new MutationObserver(function(mutations) {
    if (location.href != previousUrl) {
        previousUrl = location.href;
        console.log("EditLinker: Starting");
        Promise.all(globalPromises).catch(error => {
            console.log("EditLinker: " + error);
        }).finally(() => {
            globalPromises = [];
            onUrlChange();
        });
    }
}).observe(document, {subtree: true, childList: true});

// Do all the logic of a page change
async function onUrlChange() {
    fetchData();

    for (const anch of anchors) {
        let button_area = createButtonArea();

        if (anch.after != undefined) {
            insertAfter(await anch.after,button_area)
        } else {
            anch.target.appendChild(button_area);
        }
    }
}

// Waits until an element appear on the page. This may never happen, so this may hang!
function waitForElement(selector) {
    return new Promise((resolve, reject) => {
        const mut = new MutationObserver(mutations => {
            const element = document.querySelector(selector);
            if (element != null) {
                mut.disconnect();
                resolve(element);
            }
        });
        mut.observe(document.body, {subtree: true, childList: true});
    });
}

// -----------------------------
// | UI manipulation functions |
// -----------------------------
function createButtonArea() {
    let fieldset = document.createElement("fieldset");
    fieldset.setAttribute("class", "button-area");

    // Add legend
    let legend = document.createElement("legend");
    legend.innerText = "Search in:";
    fieldset.appendChild(legend);

    // Add buttons
    for (const link of links) {
        fieldset.appendChild(createButton(link));
    }

    return fieldset;
}

function createButton(link) {
    let link_button = document.createElement("a");
    link_button.innerText = link.text;
    link_button.setAttribute("class", "search-button");
    link_button.style.backgroundColor = link.color;

    link_button.href = link.link(data)
    link_button.target = "_blank"
    //link_button.onclick = function() {
    //    window.open(link.link(data));
    //};

    // Favicon
    let favicon_image = document.createElement("img");
    favicon_image.src = link.favicon;
    favicon_image.setAttribute("class", "button-favicon");
    link_button.appendChild(favicon_image);

    return link_button;
}


// ---------------------------
// | Data Fetching functions |
// ---------------------------

function fetchData() {
    fetchRecordingName();
    fetchArtistCredit()
}

// Read the recorning name from the header
function fetchRecordingName() {
    data.recordingName = document.querySelector(".recordingheader").children[3].innerText;
}

// Read the artist credit
function fetchArtistCredit() {
    let artistsNamesElement = document.querySelector(".subheader");

    // All the artists link have an "Title" property. We use that to get only the artist children
    let artistElements = [];
    for (const child of Array.from(artistsNamesElement.children)) {
        if (child.title !== "") {
            console.log(child.innerText);
            artistElements.push(child.innerText);
        }
    }

    // We put everything into a space separated string.
    // While using the proper musicbrainz credit file would center the search more,
    // We are dealing with search engine that could be quite strict, and so we need to dumb it down
    data.artistCredit = artistElements.join(" ");
}

// -----------------------
// | Utilities functions |
// -----------------------

function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

