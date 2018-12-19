// ==UserScript==
// @name         steamCb ITCM Helper
// @namespace    steamCb
// @version      0.1.10
// @description  Load steam game information and make charts.
// @author       narci <jwch11@gmail.com>
// @match        *://itcm.co.kr/*
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/spin.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/jquery.tablesorter.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.layout.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/ginfoBuilder.js
// @updateURL    https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.ITCMhelper.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.ITCMhelper.user.js
// @resource     cbstyle https://raw.githubusercontent.com/NarciSource/steamCb.js/master/theme.default.css
// @grant        GM.getResourceUrl
// @connect      cdn.steam.tools
// @connect      api.isthereanydeal.com
// @connect      api.steamcardexchange.net
// @license	     MIT
// ==/UserScript==


// Greasemonkey is a sandbox, but not tempermonkey, jquery crash prevention.
this.$ = window.jQuery.noConflict(true);

'use strict';


// Apply effects to charts in itcm.
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

// Add style
var addStyle = async function(resource_url) {
    $("<link>", {
        rel : "stylesheet",
        type : "text/css",
        href : await GM.getResourceUrl(resource_url)
    }).appendTo("head");
};
addStyle("cbstyle");


var steamCb = undefined;

// Create a pop-up access button at the top
$(`<li><a class="login_A">
        <label id="lb-chart-make" style="cursor:pointer">차트만들기</label>
    </a></li>`)
        .insertBefore($('li.first_login'))
        .children().children().first()
            .click(function() {
                if(!steamCb) {
                    steamCb = new SteamCb({outline: "popup", style: localStorage.getItem("theme")});
                    $("body").after(steamCb.el);
                }

                steamCb.popUp({width:680, height:750});
            });

// Create a side applet
$("div.column_login").after((new SteamCb({outline: "side", style: "itcm"})).el);
    
        
// Extract the game list of ITCM.
if( $("div.steam_read_selected").length) {
    $(`<div align="right"><button id="takeITCMchart" style="cursor:pointer">추출</button></div>`)
        .insertBefore($("div.steam_read_selected table"))
        .click(() => {
            let gids = $(".steam_read_selected tbody .app > .item_image")
                        .map((_, item) => $(item).attr("href").replace("/index.php?mid=g_board&app=",""))
                        .toArray();
            if(!steamCb) {
                steamCb = new SteamCb({outline: "popup", style: localStorage.getItem("theme")});
                $("body").after(steamCb.el);
            }

            steamCb.popUp({width:680, height:750});
            steamCb.addGames(gids);
        })
        .children().css({"background-color":"#333",
                        "border":"2px solid #333",
                        "width":"90px",
                        "padding" : "5px 10x",
                        "display" : "inline-block",
                        "font-weight":"bold",
                        "color":"#FFF"});
}