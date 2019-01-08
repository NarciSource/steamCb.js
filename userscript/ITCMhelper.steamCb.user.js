// ==UserScript==
// @name         ITCMhelper.steamCb
// @namespace    steamCb
// @version      0.1.12
// @description  Load steam game information and make charts.
// @author       narci <jwch11@gmail.com>
// @match        *://itcm.co.kr/*
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/spin.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/jquery.tablesorter.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/ginfoBuilder.js
// @resource     popup-layout https://raw.githubusercontent.com/NarciSource/steamCb.js/master/html/popup.html
// @resource     side-layout https://raw.githubusercontent.com/NarciSource/steamCb.js/master/html/side.html
// @resource     cb-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/cb.default.css
// @resource     ts-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/tablesorter.css
// @resource     table-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/table.default.css
// @resource     exchange-api http://earthquake.kr/exchange/
// @updateURL    https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/ITCMhelper.steamCb.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/ITCMhelper.steamCb.user.js
// @grant        GM.getResourceUrl
// @connect      cdn.steam.tools
// @connect      api.isthereanydeal.com
// @connect      api.steamcardexchange.net
// @license      MIT
// ==/UserScript==


// Greasemonkey is a sandbox, but not tempermonkey, jquery crash prevention.
this.$ = window.jQuery.noConflict(true);

'use strict';


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

/* Change the amount in cb-table at the current exchange rate. */
(async function() {
    try{

    const nowDate = new Date();
    nowDate.setHours(0, 0, 0, 0);

    if( localStorage["exchange"]===undefined || 
        nowDate > new Date(JSON.parse(localStorage["exchange"]).date) ) {

        const exchange = await $.get(await GM.getResourceUrl("exchange-api"));

        localStorage["exchange"] = JSON.stringify({
            date : nowDate,
            exchange : exchange
        });
    }


    const exchange = JSON.parse(localStorage["exchange"]).exchange;
    $(".cb-table td")
        .filter((_, item)=> item.innerText.includes("$"))
        .each((_, item)=> {
            const changed = "₩ "+( Number(item.innerText.substring(2)) * exchange.USDKRW[0] )
                                    .toFixed(0).replace(/\d{2}\b/g, '00').replace(/\d(?=(\d{3})+(?!\d))/g, '$&,');
            item.innerHTML = item.innerHTML.replace(item.innerText, changed);
    });

    }catch(e) {
        console.warn(e);
    }
})();




// Add style
var addStyle = async function(resource_url) {
    $("<link>", {
        rel : "stylesheet",
        type : "text/css",
        href : await GM.getResourceUrl(resource_url)
    }).appendTo("head");
};
addStyle("cb-style");
addStyle("ts-style");



// Create a pop-up access button at the top
var $applet = undefined;
$(`<li><a class="login_A">
        <label id="lb-chart-make" style="cursor:pointer">차트만들기</label>
    </a></li>`)
        .insertBefore($('li.first_login'))
        .children().children().first()
        .on("click", function() {
            
            (async function() {
                if(!$applet) {
                        $applet = $(await $.get(await GM.getResourceUrl("popup-layout")));
                        $applet.appendTo("body")
                                .steamCb({  style : await $.get(await GM.getResourceUrl("table-style")),
                                            theme : ".eevee",
                                            field : {game: "Game", ratings: "Ratings", cards: "Cards", archvment: "Archv", bundles: "BDL", lowest: "Lowest", retail: "Retail"},
                                            record : {game: "?", ratings: "?", cards: "?", archvment: "?", bundles: "?", lowest: "?", retail: "?"} });
                    }

                $applet.steamCb("popUp", {width:610, height:750});
            })();
        });



// Create a side applet
(async function() {
    let $side = $(await $.get(await GM.getResourceUrl("side-layout")));
    $side.steamCb({ style: await $.get(await GM.getResourceUrl("table-style")),
                    theme: ".itcm",
                    field : {game: "Game", cards: "C", archvment: "A", bundles: "B", lowest: "Lowest"},
                    record : {game: "?", cards: "?", archvment: "?", bundles: "?", lowest: "?"} });

    $("div.column_login").after($side);
})();


// Extract the game list of ITCM.
if( $("div.steam_read_selected").length) {
    $(`<div align="right"><button id="takeITCMchart" style="cursor:pointer">추출</button></div>`)
        .insertBefore($("div.steam_read_selected table"))
        .click(() => {
            let gids = $(".steam_read_selected tbody .app > .item_image")
                        .map((_, item) => $(item).attr("href").replace("/index.php?mid=g_board&app=",""))
                        .toArray();
                        
            (async function() {
                if(!$applet) {
                    $applet = $(await $.get(await GM.getResourceUrl("popup-layout")));
                    $applet.appendTo("body")
                            .steamCb({  style : await $.get(await GM.getResourceUrl("table-style")),
                                        theme : ".eevee",
                                        field : {game: "Game", ratings: "Ratings", cards: "Cards", archvment: "Archv", bundles: "BDL", lowest: "Lowest", retail: "Retail"},
                                        record : {game: "?", ratings: "?", cards: "?", archvment: "?", bundles: "?", lowest: "?", retail: "?"} });
                }

                $applet.steamCb("popUp")
                        .steamCb("addTable")
                        .steamCb("addGames", gids);
            })();
        })
        .children().css({"background-color":"#333",
                        "border":"2px solid #333",
                        "width":"90px",
                        "padding" : "5px 10x",
                        "display" : "inline-block",
                        "font-weight":"bold",
                        "color":"#FFF"});
}