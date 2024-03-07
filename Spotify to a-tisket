// ==UserScript==
// @name         Spotify to a-tisket Import Button
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a button to Spotify album pages to import the album into a-tisket.
// @author       YoMo
// @match        https://open.spotify.com/album/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create a button to import to a-tisket
    const importButton = document.createElement('button');
    importButton.textContent = 'Import to a-tisket';
    importButton.style.position = 'fixed';
    importButton.style.bottom = '20px';
    importButton.style.right = '20px';
    importButton.style.zIndex = '1000';
    importButton.style.padding = '10px';
    importButton.style.fontSize = '1em';
    importButton.style.backgroundColor = '#1DB954';
    importButton.style.color = 'white';
    importButton.style.border = 'none';
    importButton.style.borderRadius = '5px';
    importButton.style.cursor = 'pointer';

    // Function to open the a-tisket import page with the current Spotify album's ID
    importButton.onclick = function() {
        const currentPage = window.location.href;
        const spotID = currentPage.replace(/^(https\:\/\/open\.spotify\.com\/album\/)+/, '');
        const newURL = "https://atisket.pulsewidth.org.uk/?spf_id=" + spotID;
        window.open(newURL, '_blank').focus();
    };

    // Append the button to the body of the page
    document.body.appendChild(importButton);
})();
