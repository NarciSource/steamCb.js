// ==UserScript==
// @name         tablesorter.steamCb
// @namespace    steamCb
// @version      0.1.0
// @description  Apply the tablesorter effect to the cb-table
// @author       narci <jwch11@gmail.com>
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/jquery.tablesorter.js
// @resource     ts-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/tablesorter.css
// @updateURL    https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/tablesorter.steamCb.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/tablesorter.steamCb.user.js
// @grant        GM.getResourceUrl
// ==/UserScript==

// Greasemonkey is a sandbox, but not tempermonkey, jquery crash prevention.
this.$ = window.jQuery.noConflict(true);

'use strict';

// Add style
var addStyle = async function(resource_url) {
    $("<link>", {
        rel : "stylesheet",
        type : "text/css",
        href : await GM.getResourceUrl(resource_url)
    }).appendTo("head");
};
addStyle("ts-style");



// Apply the tablesorter effect to the cb-table.
$(".tablesorter").tablesorter({
    textExtraction : function(node) {
        if($(node).find("span").text() === "?") return -1;
        return $(node).find("span").text().replace("%","");
    },
    textSorter : {
        1 : function(a, b) {
            const refa = Number(a.match(/\d+/g).join("")),
                  refb = Number(b.match(/\d+/g).join(""));
            return (refa < refb)? -1 : ((refa > refb)? 1 : 0);
        }
    }
});