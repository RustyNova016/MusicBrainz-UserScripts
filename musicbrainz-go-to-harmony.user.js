// ==UserScript==
// @name         Musicbrainz: Go to harmony
// @version      2024.11.19.1
// @description  Add a quick link to see a release in harmony
// @author       RustyNova
// @match        https://musicbrainz.org/release/*
// @match        https://beta.musicbrainz.org/release/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=musicbrainz.org
// @namespace    https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @downloadURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/musicbrainz-go-to-harmony.user.js
// @updateURL    https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/musicbrainz-go-to-harmony.user.js
// @homepageURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @supportURL   https://github.com/RustyNova016/MusicBrainz-UserScripts/issues
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let anchor = document.getElementsByClassName("releaseheader")[0].children[1];
    console.log("Anchor");
    console.log(anchor);

    let spaned = document.createElement("span");
    spaned.setAttribute("class", `search-link-container`);

    let icon = document.createElement("a");
    let mbid = document.location.href.split("/")[4]
    icon.href = `https://harmony.pulsewidth.org.uk/release/actions?release_mbid=${mbid}`
    icon.setAttribute("class", `search-link harmony-icon`);
    icon.target="_blank";

    //anchor.append(icon);
    anchor.append(spaned);
    spaned.append(icon);

    // Your code here...
})();

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
        .harmony-icon {
   background-image: url("https://harmony.pulsewidth.org.uk/favicon.svg") !important;
        }

        `;
        head.appendChild(style);
    }
}
main();
