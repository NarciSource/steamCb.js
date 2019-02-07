// ==UserScript==
// @name         tablesorter.steamCb
// @namespace    steamCb
// @version      0.1.2
// @description  Apply the tablesorter effect to the cb-table
// @author       narci <jwch11@gmail.com>
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.1/js/jquery.tablesorter.min.js
// @resource     ts-style https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.1/css/theme.default.min.css
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
$(".cb-table").tablesorter({
    textExtraction : function(node) {
        if($(node).find('a').text() === "?" || $(node).find('a').text() === "-") return -1;
        return $(node).find('a').text().replace("%","");
    },
    textSorter : {
        '[name="ratings"]' : function(a, b) {
            const regx = /^[\w\s]+\((\d+)\)/,
                  refa = a==="-1"? -1 : regx.exec(a)[1] ,
                  refb = b==="-1"? -1 : regx.exec(b)[1] ;
            return (refa < refb)? -1 : ((refa > refb)? 1 : 0);
        }
    }
});