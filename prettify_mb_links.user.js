'use strict';
// ==UserScript==
// @name        Prettify musicbrainz links
// @namespace   Violentmonkey Scripts
// @match       https://*.musicbrainz.org/*
// @version     1.0
// @author      RustyNova
// @description 12/29/2025, 2:32:34 PM
// @run-at      document-end
// @grant       GM.xmlHttpRequest
// ==/UserScript==

const regex = new RegExp('^https:\/\/(?<domain>(test\.|beta\.|)musicbrainz\.org)\/(?<ent_type>artist|recording|release|release-group)\/(?<mbid>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}).*$', '')
let globalPromises = []


let links = document.getElementsByTagName("a");


async function run_link_handling(link) {
  let matches = regex.exec(link.href);

  if (matches === null) {
    return null
  }

  // Verify that it's actually a unformated link
  if (!link.innerText.startsWith("http")) {
    return null;
  }

  let ent_type = matches.groups["ent_type"]

  let includes = ""
  if (ent_type === "recording" || ent_type === "release" || ent_type === "release-group") {
    includes = "&inc=artist-credits"
  }

  let response = await GM.xmlHttpRequest({
      url: `https://${matches.groups["domain"]}/ws/2/${ent_type}/${matches.groups["mbid"]}?fmt=json${includes}`,
      method: "GET",
      responseType: "json"
  });

  link.replaceWith(new_links(response.response, matches.groups["domain"], ent_type))
}

console.info("Found", links.length, "links")

for (const link of links) {
  globalPromises.push(run_link_handling(link))
  Promise.all(globalPromises)
}


function new_links(mb_data, domain, ent_type) {
   let container = document.createElement("span");

   let title = create_title(mb_data, domain, ent_type)

   container.appendChild(title);
   create_artist_credits(container, mb_data["artist-credit"], domain)
  return container
}

function create_title(mb_data, domain, ent_type) {
  let title = document.createElement("a");

  title.innerHTML = mb_data.title !== undefined? mb_data.title : mb_data.name;
  title.href = `https://${domain}/${ent_type}/${mb_data.id}`

  return title
}

function create_artist_credits(container, artist_credits, domain) {
  if (artist_credits === undefined || artist_credits.length === 0) {
    return
  }

  container.append(" by ")

  for (const credit of artist_credits) {
    container.append(create_artist_credit(credit, domain))
    container.append(credit.joinphrase)
  }
}

function create_artist_credit(artist_credit, domain) {
  let credit = document.createElement("a");
  credit.innerHTML = artist_credit.name;
  credit.href = `https://${domain}/artist/${artist_credit.artist.id}`

  return credit
}
