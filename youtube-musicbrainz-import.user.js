// ==UserScript==
// @name        MusicBrainz: Import videos from YouTube as release
// @version     2014-09-07
// @author      Freso - RustyNova
// @namespace   df069240-fe79-11dc-95ff-0800200c9a66
// @require https://raw.github.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @namespace   https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @downloadURL https://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/youtube-musicbrainz-import.user.js
// @updateURL   hhttps://github.com/RustyNova016/MusicBrainz-UserScripts/raw/main/youtube-musicbrainz-import.user.js
// @homepageURL https://github.com/RustyNova016/MusicBrainz-UserScripts/
// @supportURL  https://github.com/RustyNova016/MusicBrainz-UserScripts/issues
// @include     *://www.youtube.com/watch?*
//
// Forked from https://bitbucket.org/Freso/nikki-userscripts/src/2bafb61929ed2a4296029e7311bad8f357f44245/youtube-importer/youtube-importer.user.js?fileviewer=file-view-default
//
// ==/UserScript==
//**************************************************************************//

var google_api_key = "AIzaSyC5syukuFyCSoRvMr42Geu_d_1c_cRYouU"

var myform = document.createElement("form");
myform.method = "post";
myform.action = "//musicbrainz.org/release/add";
myform.acceptCharset = "UTF-8";
myform.target = "_blank";

mysubmit = document.createElement("input");
mysubmit.type = "submit";
mysubmit.value = "Add to MusicBrainz";
mysubmit.setAttribute("class", "search-button");
myform.appendChild(mysubmit);
myform.setAttribute("class", "holder");

var div = document.createElement("div");
div.setAttribute("class", "holder");
//div.style.position = 'absolute';
//div.style.top = 0;
//div.style.right = 0;
//div.style.padding = '20px';
//div.style.margin = '50px';
//div.style.zIndex = '10000';

var m = document.location.href.match(/\?v=([A-Za-z0-9_-]{11})/);
if (m && m[1]) {
	var yt_ws_url = "//www.googleapis.com/youtube/v3/videos?part=snippet,id,contentDetails&id=" + m[1] + "&key=" + google_api_key;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', yt_ws_url, true);
	xmlhttp.onreadystatechange = function() { yt_callback(xmlhttp); }
	xmlhttp.send(null);
}

function yt_callback(req) {
	if (req.readyState != 4)
		return;
	var r = eval('(' + req.responseText + ')').items[0];

	var video_id = r.id;
	var title = r.snippet.title;
	var artist = r.snippet.channelTitle;
    var publishedAt = new Date(r.snippet.publishedAt);
    var day = publishedAt.getDate()
    var month = publishedAt.getMonth() + 1
    var year = publishedAt.getFullYear()
	var length = MBImport.ISO8601toMilliSeconds(r.contentDetails.duration);

    // New
    add_field("artist_credit.names.0.name", artist);
    add_field("events.0.country", "XW");
    add_field("mediums.0.format", "Digital Media");
    add_field("events.0.date.day", day);
    add_field("events.0.date.month", month);
    add_field("events.0.date.year", year);
    add_field("mediums.0.track.0.artist_credit.names.0.name", artist);
    add_field("mediums.0.track.0.length", length);
    add_field("mediums.0.track.0.name", title);
    add_field("name", title);
    add_field("packaging", "none");
    add_field("status", "official");
    add_field("type", "single");
    add_field("urls.0.url", document.location.href);
    add_field("urls.0.link_type", "85");
    add_field("edit_note", document.location.href);

	var mb_ws_url = "https://musicbrainz.org/ws/2/url?limit=1&fmt=json&inc=artist-rels+label-rels+release-rels&resource=http://www.youtube.com/watch%3Fv=" + video_id;
	var xmlhttp2 = new XMLHttpRequest();
	xmlhttp2.open('GET', mb_ws_url, true);
	xmlhttp2.onreadystatechange = function() { mb_callback(xmlhttp2); }
	xmlhttp2.send(null);
}

function mb_callback(req) {
	if (req.readyState != 4)
		return;
	var r = eval('(' + req.responseText + ')');

	if (r.relations) {
        mysubmit.style.backgroundColor ='#646464';
		div.innerHTML = "<a href='//musicbrainz.org/url/" + r.id + "'>Already in MB</a> :D";
		document.body.appendChild(div);
	} else {
        mysubmit.style.backgroundColor = '#BA478F';
		div.appendChild(myform);
	}

    let dock = waitForElementById(`top-level-buttons-computed`).then((dock) => {dock.appendChild(div);})

}

function add_field (name, value) {
	var field = document.createElement("input");
	field.type = "hidden";
	field.name = name;
	field.value = value;
	myform.appendChild(field);
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
            padding: 5px
        }

        .button-favicon {
            height: 1.25em;
            margin-left: 5px;
        }

        .holder {
            height: 100%;
        }

        .search-button {
            border-radius: 18px;
            border: none;
            padding: 5px 10px;
            font-size: 14px;
            height: 100%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            text-decoration: inherit; /* no underline */
            margin: 0px 0 0 10px
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

