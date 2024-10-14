// ==UserScript==
// @name        Beatport: MusicBrainz import links
// @description Import Beatport releases into MusicBrainz using ony or jump to the release
// @version     2024.10.14.1
// @author      RustyNova
// @namespace   https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @downloadURL https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/beatport-musicbrainz-import.user.js
// @updateURL   https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/beatport-musicbrainz-import.user.js
// @homepageURL https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @supportURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/issues
// @match        https://www.beatport.com/release/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=beatport.com
// @grant       GM.xmlHttpRequest
// ==/UserScript==

let globalPromises = []
let previousUrl = '';
new MutationObserver(function(mutations) {
    // Wait until the page is a new one.
    if (location.href != previousUrl) {
        // New page! Let's start the script.
        previousUrl = location.href;

        // Let's run the hook
        Promise.all([onUrlChange()]);
    }
}).observe(document, {subtree: true, childList: true});

async function onUrlChange() {
    // get the anchor
    let anchor = await waitForElement("ReleaseDetailCard-style__Meta-sc-67b900a1-8 gznAvH full");
    let container = add_container(anchor);

    console.log(`Anchor:`, anchor)
    console.log(`Catalog number: ${get_catalog_number(anchor)}`)

    add_ony_import(container)

    let url_in_mb = await search_url_in_musicbrainz(window.location.href)
    if (url_in_mb !== undefined) {
        console.log("found");
        add_open_button(container, url_in_mb[0], url_in_mb[1])
    } else {
        let data = get_props_data();
        add_search_button(container, data.props.pageProps.release.artists[0].name, data.props.pageProps.release.name);
    }


}

function get_anchor() {
    document.getElementsByClassName("ReleaseDetailCard-style__Meta-sc-67b900a1-8 gznAvH full")[0]
}

function get_catalog_number(anchor) {
    for (const child of anchor.children) {
       if (child.children[0] === undefined) {continue}

       if (child.children[0].innerHTML === "Catalog") {
           return child.children[1].innerHTML
       }
    }
}

function waitForElement(selector) {
    return new Promise((resolve, reject) => {
        const mut = new MutationObserver(mutations => {
            const element = document.getElementsByClassName(selector)[0]

            if (element != null) {
                mut.disconnect();
                resolve(element);
            }
        });

        mut.observe(document.body, {subtree: true, childList: true});
    });
}



// --- Data Functions ---
function get_props_data() {
    return JSON.parse(document.getElementById('__NEXT_DATA__').innerHTML);
}

// --- UI Functions ---
function add_container(anchor) {
    // If there has been a conatiner anchored already, remove it. It's most likely stale data.
    if (anchor.lastChild.classList[0] === "button_container") {
        anchor.removeChild(anchor.lastChild);
    }

    let container = document.createElement("div");
    container.className = "button_container";
    anchor.appendChild(container);

    return container
}

function add_ony_import(anchor) {
    let ony_button = document.createElement("button");
    ony_button.innerHTML = "Import with ony";
    ony_button.className = "Share-style__Item-sc-2edeb195-3 ijWhIR button_ony enabled"

    ony_button.onclick = function() {
            const currentPage = window.location.href;
            const newURL = "https://ony.pulsewidth.org.uk/release?gtin=&region=&musicbrainz=&deezer=&itunes=&spotify=&tidal=&beatport=&url=" + currentPage;
            window.open(newURL, '_blank').focus();
    };

    anchor.appendChild(ony_button);
}

function add_open_button(anchor, type, mbid) {
    let button = document.createElement("button");
    button.innerHTML = "Open in MusicBrainz";
    button.className = "Share-style__Item-sc-2edeb195-3 ijWhIR button_mb enabled"

    button.onclick = function() {
            window.open(`https://musicbrainz.org/${type}/${mbid}`).focus();
    };

    anchor.appendChild(button);
}

function add_search_button(anchor, artist, release) {
    let button = document.createElement("button");
    button.innerHTML = "Search in MusicBrainz";
    button.className = "Share-style__Item-sc-2edeb195-3 ijWhIR button_mb enabled"

    button.onclick = function() {
            window.open(`https://musicbrainz.org/taglookup/index?tag-lookup.artist=${artist}&tag-lookup.release=${release}`, '_blank').focus();
    };

    anchor.appendChild(button);
}

// --- Musicbrainz Functions
// async function search_catalog_in_musicbrainz(catalog_num) {
//     GM.xmlHttpRequest({
//                 url: `https://musicbrainz.org/ws/2/release/?fmt=json&query=catno:${catalog_num}`,
//                 method: "GET",
//                 responseType: "json",
//                 onload: function(response) {
//                     if (!response.response.error && response.response.releases.length > 0) {
//                         let top_release = response.response.releases[0];
//                         let mbid = top_release.id;
//                         return mbid
//                     } else {
//                         return null
//                     }
//                 }
//             });
// }

async function search_url_in_musicbrainz(url) {
    return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                url: "https://musicbrainz.org/ws/2/url?limit=1&fmt=json&inc=artist-rels+label-rels+release-rels&resource="+url,
                method: "GET",
                responseType: "json",
                onload: function(response) {
                    if (!response.response.error && response.response.relations.length > 0) {
                        let targetType = response.response.relations[0]["target-type"];
                        let mbid = response.response.relations[0][targetType]["id"];
                        resolve([targetType, mbid])
                    } else {
                        resolve(undefined)
                    }
                },
                onerror: function(e) {
                    reject(e);
                }
            });
    });
}

// --- CSS ---

// Insert CSS into the Head
function main() {
    let head = document.getElementsByTagName('head')[0];
    if (head) {
        let style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `
            .button_container {
                 display: flex,
            }
            .button_mb {
                 background-color: #BA478F;
                 width: 12.5em
            }
            .button_ony {
                 background-color: #c45555;
                 width: 12.5em;
                 margin-right: 15px;
            }
        `;
        head.appendChild(style);
    }
}
main();
