// ==UserScript==
// @name         Spotify: MusicBrainz Status
// @version      2024-11-19.1
// @description  try to take over the world!
// @author       RustyNova
// @match        https://open.spotify.com/*
// @namespace   https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @downloadURL https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/spotify-musicbrainz-status.user.js
// @updateURL   https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/spotify-musicbrainz-status.user.js
// @homepageURL https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @supportURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/issues
// @icon         https://www.google.com/s2/favicons?sz=64&domain=spotify.com
// @run-at      document-end
// @grant         GM.xmlHttpRequest
// ==/UserScript==
'use strict';

let global_albums = new Map();
let running_update = false;
let schedule_update = false;

let globalPromises = []
let form, entity, formString;
let previousAlbumCount = 0;

// Spotify integration variables
let card_root_class_name = "kcRGDn"; // Change every CSS refresh.

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
    globalPromises.push(get_all_albums())
    Promise.all(globalPromises)
}

// Get all the albm cards
async function get_all_albums() {
    let all_cards = document.getElementsByClassName(card_root_class_name);

    if (all_cards.length === 0) {
        console.log("[MB Status] No Album cards found. If you expect some, the CSS might have changed. Check card_root_class_name");
        return
    }

    console.log("[MB Status] Album card count: " + all_cards.length)
    if (all_cards.length === previousAlbumCount) {return}
    previousAlbumCount = all_cards.length
    if (all_cards.length === 0) {return}

    console.log(all_cards);

    for (const card of all_cards) {
        await handle_album_card(card);
    }
}

async function handle_album_card(card_root) {
    // First element is the title. It contains thaa partial link toward the album
    let link = `${get_card_title_root(card_root).href}`

    // Check if the card is really an album card
    const regex = new RegExp('https:\/\/open\.spotify\.com\/album\/.*');

    if (!regex.test(link)) {return}
    let original_image_area_root = get_card_image_area(card_root);
    original_image_area_root.classList.add("loading-album-image");


    console.log("link:" + link);

    // Now that we have a link, we ask musicbrainz if it exist in the DB
    let exist = await UrlInMusicBrainz(link);

    console.log("Exist in MB: " + exist);
    // And we set the status
    console.log(`Status update for ${link}`, exist )

    // We set the status icon in the artist line
    handle_status_icon(link, exist !== null, get_card_info_area(card_root), card_root)
}

// Handle the statust icon for a specific album
function handle_status_icon(id, in_musicbrainz, anchor_element, card_root) {
    let original_image_area_root = get_card_image_area(card_root);

    // Get the status icon, or create it
    let status_icon_img = document.getElementById(`status_icon_${id}_img`);

    if (status_icon_img === null) {
        // Create wrapper
        let wrapper = document.createElement("span");
        wrapper.setAttribute("class", "mb_wrapper");

        // Create vertical aligment for the standart text
        let standard_align = document.createElement("span");
        //standard_align.setAttribute("class", "mb_valign");
        //anchor_element.children[0].classList.add("mb_valign");
        //standard_align.appendChild(anchor_element.children[0]); // Add the original date and type as chile
        //wrapper.appendChild(standard_align); // Add it to the wrapper
        //anchor_element.appendChild(wrapper); // Add teh wrapper as the new inside

        // Add the alignement for the icon
        let icon_align = document.createElement("span");
        //icon_align.setAttribute("class", "mb_valign");
        //wrapper.appendChild(icon_align);

        // Create the status icon
        status_icon_img = document.createElement("img");
        status_icon_img.id = `status_icon_${id}`;
        status_icon_img.src = "https://musicbrainz.org/static/images/entity/release.svg";

        //status_icon_img.setAttribute("class", "status_icon");

        //icon_align.appendChild(status_icon_img);
    }

    original_image_area_root.classList.remove("loading-album-image");
    if (in_musicbrainz) {
        status_icon_img.style.display = 'block'

    } else {
        status_icon_img.style.display = 'none'
        // Get the parent card root
        //card_root.classList.add('unlinked-card');
        original_image_area_root.classList.add("unlinked-album-image");
    }
}

// Credit: https://github.com/garylaski/userscripts
let urlCache = new Map();
let cached, targetType, mbid;
async function UrlInMusicBrainz(url) {
    cached = urlCache.get(url);
    if (cached === undefined) {
        while (true) {
            let tries = 0;
            // Request throttling
            await sleep(1000 * tries);

            let response = await GM.xmlHttpRequest({
                url: "https://musicbrainz.org/ws/2/url?limit=1&inc=artist-rels+label-rels+release-rels&fmt=json&resource="+url,
                method: "GET",
                responseType: "json"
            });

            if (!response.response.error && response.response.relations.length > 0) {
                targetType = response.response.relations[0]["target-type"];
                mbid = response.response.relations[0][targetType]["id"];
                urlCache.set(url, [targetType, mbid])
                return [targetType, mbid]
            } else {
                let regex = new RegExp('Your requests are exceeding the allowable rate limit.');

                // If it isn't a ratelimit issue
                if (!regex.test(response.response.error)) {
                    urlCache.set(url, null)
                    return null
                } else {
                    tries += 1;
                }
            }
        }
    } else {
        return cached;
    }
}

// Insert CSS into the Head
function main() {
    let head = document.getElementsByTagName('head')[0];
    if (head) {
        let style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `
             .unlinked_album {
                 text-color: red;
             }

             .unlinked-album-image {
                  border: red solid;
                  border-width: 4px 0px;
                  border-radius: 5px;
             }

             .loading-album-image {
                  border: orange solid;
                  border-width: 4px 0px;
                  border-radius: 5px;
             }

             .mb_wrapper {
                 display: block;
             }

             .mb_valign {
                 display: inline-block;
                 vertical-align: top;
             }

             .unlinked-card {
                 background-color: #281515
             }

             .status_icon {
                 height: 20px;
                 width: 20px;
                 position: fixed;
                 margin-left: 5px;
                 background-image: url(data:image/svg+xml,%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%2020010904%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FTR%2F2001%2FREC-SVG-20010904%2FDTD%2Fsvg10.dtd%22%3E%0A%3Csvg%20version%3D%221.0%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300px%22%20height%3D%22300px%22%20viewBox%3D%220%200%203000%203000%22%20preserveAspectRatio%3D%22xMidYMid%20meet%22%3E%3Cg%20fill%3D%22%23fffedb%22%20stroke%3D%22none%22%3E%0A%20%3Cpath%20d%3D%22M1565%202971%20c-3%20-6%203%20-15%2014%20-21%2012%20-6%2022%20-6%2026%20-1%203%206%20-3%2015%20-14%2021%20-12%206%20-22%206%20-26%201z%22%2F%3E%0A%20%3Cpath%20d%3D%22M2005%202721%20c-3%20-6%203%20-15%2014%20-21%2012%20-6%2022%20-6%2026%20-1%203%206%20-3%2015%20-14%2021%20-12%206%20-22%206%20-26%201z%22%2F%3E%0A%20%3Cpath%20d%3D%22M2265%202571%20c-3%20-6%203%20-15%2014%20-21%2012%20-6%2022%20-6%2026%20-1%203%206%20-3%2015%20-14%2021%20-12%206%20-22%206%20-26%201z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1380%202383%20c-197%20-33%20-369%20-120%20-506%20-257%20-274%20-274%20-343%20-683%20-174%20-1032%20115%20-239%20343%20-422%20602%20-484%20100%20-24%20289%20-27%20388%20-6%20289%2061%20532%20263%20651%20540%2050%20117%2063%20189%2063%20346%200%20173%20-14%20238%20-83%20385%20-124%20261%20-362%20444%20-649%20501%20-68%2013%20-232%2017%20-292%207z%20m-229%20-374%20c48%20-68%2088%20-129%2088%20-134%201%20-6%20-24%20-35%20-54%20-65%20l-54%20-54%20-131%2088%20c-72%2047%20-133%2093%20-136%20101%20-11%2026%20162%20201%20190%20192%205%20-2%2049%20-59%2097%20-128z%20m505%20-208%20c78%20-37%20129%20-88%20166%20-168%2028%20-58%2030%20-70%2026%20-156%20-4%20-111%20-28%20-168%20-100%20-239%20-63%20-62%20-137%20-89%20-243%20-91%20-67%20-1%20-89%203%20-136%2025%20-113%2052%20-179%20139%20-200%20264%20-14%2087%204%20168%2055%20248%2038%2059%2068%2084%20148%20121%2043%2020%2069%2025%20138%2025%2073%200%2094%20-4%20146%20-29z%20m380%20-677%20c68%20-47%20124%20-91%20124%20-97%200%20-14%20-130%20-150%20-166%20-174%20-13%20-8%20-28%20-12%20-33%20-9%20-6%204%20-49%2065%20-97%20137%20l-88%20129%2054%2055%20c32%2033%2060%2053%2069%2050%207%20-3%2069%20-44%20137%20-91z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1456%201549%20c-20%20-16%20-26%20-29%20-26%20-58%200%20-74%2083%20-109%20135%20-56%2073%2072%20-28%20178%20-109%20114z%22%2F%3E%0A%20%3Cpath%20d%3D%22M425%20611%20c-3%20-6%203%20-15%2014%20-21%2012%20-6%2022%20-6%2026%20-1%203%206%20-3%2015%20-14%2021%20-12%206%20-22%206%20-26%201z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1125%20211%20c-3%20-6%203%20-15%2014%20-21%2012%20-6%2022%20-6%2026%20-1%203%206%20-3%2015%20-14%2021%20-12%206%20-22%206%20-26%201z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1195%20171%20c-3%20-6%203%20-15%2014%20-21%2012%20-6%2022%20-6%2026%20-1%203%206%20-3%2015%20-14%2021%20-12%206%20-22%206%20-26%201z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1315%20101%20c-3%20-6%203%20-15%2014%20-21%2012%20-6%2022%20-6%2026%20-1%203%206%20-3%2015%20-14%2021%20-12%206%20-22%206%20-26%201z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1385%2060%20c-3%20-5%208%20-16%2024%20-25%2018%20-9%2032%20-11%2036%20-5%203%205%20-8%2016%20-24%2025%20-18%209%20-32%2011%20-36%205z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1455%2021%20c-3%20-5%204%20-13%2016%20-16%2028%20-9%2033%20-2%209%2013%20-11%206%20-21%208%20-25%203z%22%2F%3E%0A%20%3C%2Fg%3E%0A%0A%3Cg%20fill%3D%22%23ba478f%22%20stroke%3D%22none%22%3E%0A%20%3Cpath%20d%3D%22M1410%202959%20c-41%20-22%20-87%20-48%20-102%20-57%20-22%20-14%20-88%20-52%20-280%20-162%20-56%20-32%20-200%20-116%20-232%20-135%20-18%20-11%20-75%20-44%20-127%20-73%20-52%20-30%20-130%20-76%20-174%20-103%20-44%20-27%20-98%20-58%20-120%20-70%20-77%20-41%20-106%20-57%20-145%20-83%20l-39%20-26%201%20-755%201%20-756%2061%20-35%20c58%20-33%2073%20-42%20121%20-69%2011%20-6%2039%20-23%2063%20-38%2024%20-15%2053%20-32%2065%20-38%2012%20-5%2040%20-20%2062%20-34%2022%20-13%2047%20-27%2055%20-31%208%20-4%2023%20-14%2033%20-22%209%20-8%2017%20-12%2017%20-7%200%204%2015%20-3%2033%20-17%2017%20-13%2043%20-29%2057%20-36%2014%20-6%2032%20-16%2040%20-21%2014%20-9%20321%20-184%20400%20-228%2019%20-11%2064%20-38%20100%20-60%2036%20-22%2068%20-40%2073%20-41%204%20-1%2034%20-15%2067%20-32%2033%20-16%2066%20-30%2073%20-30%2019%200%2072%2024%20122%2055%2022%2013%2056%2033%2075%2043%2019%2011%2062%2035%2095%2054%2033%2019%2071%2041%2085%2049%2014%208%2032%2019%2040%2025%208%206%2047%2028%2085%2049%2039%2020%2077%2043%2085%2050%208%206%2050%2032%2093%2056%2043%2024%2098%2055%20122%2069%2024%2014%2074%2042%20112%2064%2037%2021%2084%2049%20103%2061%2019%2013%2055%2034%2080%2048%2025%2013%2061%2034%2080%2045%2019%2012%2055%2032%2080%2045%20l45%2024%201%20744%20c0%20409%20-3%20753%20-7%20765%20-5%2014%20-95%2072%20-258%20167%20-139%2081%20-253%20147%20-255%20147%20-3%200%20-41%2023%20-86%2050%20-45%2028%20-91%2055%20-103%2061%20-12%205%20-40%2020%20-62%2034%20-22%2013%20-53%2031%20-70%2040%20-59%2031%20-132%2072%20-280%20158%20-82%2047%20-163%2089%20-180%2092%20-23%204%20-49%20-5%20-105%20-36z%20m309%20-609%20c264%20-64%20475%20-236%20591%20-483%2058%20-124%2080%20-226%2080%20-378%200%20-165%20-27%20-278%20-102%20-421%20-114%20-220%20-317%20-376%20-573%20-444%20-103%20-27%20-322%20-25%20-428%204%20-275%2075%20-494%20265%20-596%20519%20-53%20129%20-63%20196%20-59%20370%204%20148%206%20164%2037%20255%2098%20288%20324%20498%20614%20573%20124%2032%20313%2034%20436%205z%22%2F%3E%0A%20%3Cpath%20d%3D%22M972%202095%20c-39%20-37%20-86%20-84%20-103%20-106%20-31%20-40%20-32%20-41%20-13%20-59%2010%20-10%2076%20-57%20147%20-104%20l127%20-85%2066%2065%2065%2064%20-98%20142%20c-54%2078%20-103%20143%20-109%20145%20-6%202%20-43%20-26%20-82%20-62z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1420%201841%20c-102%20-33%20-195%20-114%20-240%20-206%20-36%20-73%20-40%20-189%20-9%20-270%2031%20-83%20130%20-183%20212%20-213%2077%20-29%20177%20-29%20252%20-1%2074%2027%20165%20112%20202%20187%2024%2050%2028%2069%2028%20147%200%2077%20-4%2098%20-27%20147%20-35%2076%20-95%20138%20-170%20179%20-54%2028%20-75%2033%20-143%2036%20-44%201%20-91%20-1%20-105%20-6z%20m139%20-307%20c23%20-21%2018%20-74%20-9%20-96%20-42%20-34%20-110%20-6%20-110%2045%200%2063%2073%2095%20119%2051z%22%2F%3E%0A%20%3Cpath%20d%3D%22M1824%201171%20l-62%20-67%2097%20-139%20c53%20-76%20102%20-141%20109%20-143%2013%20-4%20212%20189%20212%20207%200%209%20-178%20138%20-260%20188%20l-35%2021%20-61%20-67z%22%2F%3E%0A%20%3C%2Fg%3E%0A%0A%3C%2Fsvg%3E%0A)
             }
        `;
        head.appendChild(style);
    }
}
main();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Return the element where the card info is
function get_card_info_area(card_root) {
    return card_root.children[3]
}

// Return the element where the card image root is
function get_card_image_area(card_root) {
    return card_root.children[2]
}

function get_card_title_root(card_root) {
    return get_card_info_area(card_root).children[0].children[0]
}

(function() {


    // Your code here...
})();
