// ==UserScript==
// @name         ITCMhelper.steamCb
// @namespace    steamCb
// @version      0.1.20
// @description  Load steam game information and make charts.
// @author       narci <jwch11@gmail.com>
// @match        *://itcm.co.kr/*
// @icon         https://raw.githubusercontent.com/NarciSource/steamCb.js/master/img/cb-icon.png
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.1/js/jquery.tablesorter.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.8.0/jquery.contextMenu.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/vendor/require.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/vendor/magicsuggest.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.2/ace.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.2/mode-css.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.2/mode-json.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/src/ginfoBuilder.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/src/steamCb.js
// @resource     popup-layout https://raw.githubusercontent.com/NarciSource/steamCb.js/master/html/popup.html
// @resource     side-layout https://raw.githubusercontent.com/NarciSource/steamCb.js/master/html/side.html
// @resource     cb-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/cb.default.css
// @resource     table-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/table.default.css
// @resource     ts-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/tablesorter.css
// @resource     cm-style https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.8.0/jquery.contextMenu.css
// @resource     ms-style https://cdnjs.cloudflare.com/ajax/libs/magicsuggest/2.1.4/magicsuggest-min.css
// @resource     exchange-api http://earthquake.kr/exchange/
// @updateURL    https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/ITCMhelper.steamCb.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/ITCMhelper.steamCb.user.js
// @grant        GM.getResourceUrl
// @grant        GM.xmlHttpRequest
// @connect      api.steampowered.com
// @connect      api.isthereanydeal.com
// @license      MIT
// ==/UserScript==


// Greasemonkey is a sandbox, but not tempermonkey, jquery crash prevention.
this.$ = window.jQuery.noConflict(true);

// Overwrite GM.xmlHttpRequest in $.ajax to avoid Access-Control-Allow-Origin.
const originAjax = $.ajax;
$.ajax = function(url, options) {
    if ( typeof url === "object" ) {
        options = url;
        url = undefined;
    }
    if( /^blob:(\w+)/.test( options.url ) ) {
        return originAjax(url, options);
    }
    console.log(options.type || "GET", options.url);

    let dfd = $.Deferred();

    GM.xmlHttpRequest( $.extend( {}, options, {
        method: "GET",
        onload: response => {
            const headerRegex = /([\w-]+): (.*)/gi;
                  mimeRegex = /(^\w+)\/(\w+)/g;

            let headers = {}, match;
            while( match = headerRegex.exec(response.responseHeaders) ) {
                headers[ match[1].toLowerCase() ] = match[2].toLowerCase();
            }

            let [mime, mime_type, mime_subtype] = mimeRegex.exec( headers["content-type"] );
            switch(mime_subtype) {
                case "xml":
                    dfd.resolve( new DOMParser().parseFromString( response.responseText, mime ) );
                    break;
                case "json":
                    dfd.resolve( JSON.parse(response.responseText) );
                    break;
            }
            dfd.resolve(response.responseText);
        },
        onerror: error => dfd.reject(error)
    }));

    return dfd.promise();
};

'use strict';

// Apply the tablesorter effect to the cb-table.
$(".cb-table").tablesorter({
    textExtraction : function(node) {
        if($(node).find("a").text() === "?") return -1;
        return $(node).find("a").text().replace("%","");
    },
    textSorter : {
        "[name='ratings']" : function(a, b) {
            const regx = /^[\w\s]+\((\d+)\)/,
                  refa = a==="-1"? -1 : regx.exec(a)[1] ,
                  refb = b==="-1"? -1 : regx.exec(b)[1] ;
            return (refa < refb)? -1 : ((refa > refb)? 1 : 0);
        }
    }
});

// Change the amount in cb-table at the current exchange rate.
(async function() {
    try{

    const date = new Date();    
    date.setHours(0, 0, 0, 0);

    if( localStorage["exchange"]===undefined || 
        date > new Date(JSON.parse(localStorage["exchange"]).date) ) {

        const exchange = await $.get(await GM.getResourceUrl("exchange-api"));

        localStorage["exchange"] = JSON.stringify({ date, exchange });
    }


    const exchange = JSON.parse(localStorage["exchange"]).exchange;
    $(".cb-table td")
        .filter((_, item)=> item.innerText.includes("$"))
        .each((_, item)=> {
            let innerHTML = item.innerHTML,
                [match, num] = /\$\s*(\d+\.\d+)/.exec(innerHTML);
            num = (Number(num) * exchange.USDKRW[0])
                    .toFixed(0)
                    .replace(/\d{2}\b/g, '00')
                    .replace(/\d(?=(\d{3})+(?!\d))/g, '$&,');
            item.innerHTML = innerHTML.replace(/\$(\s*)\d+\.\d+/g, "₩$1"+num);
    });

    }catch(e) {
        console.warn(e);
    }
})();




// Add stylesheet
const addStyle = async function(resource_url) {
    $("<link>", {
        rel : "stylesheet",
        type : "text/css",
        href : await GM.getResourceUrl(resource_url)
    }).appendTo("head");
};
addStyle("cb-style");
addStyle("ts-style");
addStyle("cm-style");
addStyle("ms-style");





// Create a side applet
(async function() {
    let $side = $(await $.get(await GM.getResourceUrl("side-layout")));
    $side.steamCb({ idTag : "cb-0",
                    hyperlink : false,
                    style : await $.get(await GM.getResourceUrl("table-style")),
                    theme : ".itcm",
                    field : {title: "Game", cards: "C", archvment: "A", bundles: "B", lowest: "Lowest"},
                    record : {title: "?", cards: "?", archvment: "?", bundles: "?", lowest: "?"} });

    $("div.column_login").after($side);
})();



// Create a pop-up access button at the to
var $applet = undefined;
$("<li/>", {
    html: $("<a/>", {
            class: 'login_A',
            style: 'cursor:pointer',
            text: "차트만들기"}),
    on: {
        click: async function() {
            if(!$applet) {
                    $applet = $(await $.get(await GM.getResourceUrl("popup-layout")));
                    $applet.appendTo("body")
                            .steamCb({  idTag : "cb-1",
                                        hyperlink : false,
                                        style : await $.get(await GM.getResourceUrl("table-style")),
                                        theme : ".eevee",
                                        field : {title: "Game", ratings: "Ratings", cards: "Cards", archvment: "Archv", bundles: "BDL", lowest: "Lowest", retail: "Retail"},
                                        record : {title: "?", ratings: "-", cards: "?", archvment: "?", bundles: "?", lowest: "?", retail: "?"} });
                }

            $applet.steamCb("popUp");
        }
    }
}).prependTo($("ul.wrap_login div"));


// Extract the game list of ITCM.
if( $('div.steam_read_selected').length) {
    if( $('.itcm-game-toolbox').length === 0) {
        $('<div>', {
            class: 'itcm-game-toolbox',
            css: {'display': 'flex',
                  'position': 'absolute',
                  'margin': '0px 0px 0px 735px',
                  'padding': '5px 10px 3px 0px',
                  'background': 'rgb(51, 51, 51)',
                  'border-radius': '0px 20px 20px 0px' }
        }).insertBefore($('div.steam_read_selected'));
    }

    $("<div/>", {
        class: 'fa fa-magic',
        css: {'padding-left': '10px',
              'color': 'white',
              'font-size': '15px',
              'line-height': '20px',
              'cursor': 'pointer' },
        on: {
            mouseenter: function() {
                $(this).animate({ deg: 360 }, {
                            duration: 600,
                            step: function(now) {
                                $(this).css({ transform: `rotate(${now}deg)` });
                            },
                            complete: function() {
                                $(this)[0].deg=0;
                            }
                        }
                );
            },
            click: async function() {
                let ids = $(".steam_read_selected .item_content .name")
                            .map((idx, item) => {
                                const [match, div, id] = /steampowered\.com\/(\w+)\/(\d+)/.exec( $(item).attr("href") );
                                return {div,id};
                            }).toArray();
                if(!$applet) {
                    $applet = $(await $.get(await GM.getResourceUrl("popup-layout")));
                    $applet.appendTo("body")
                            .steamCb({  idTag : "cb-1",
                                        style : await $.get(await GM.getResourceUrl("table-style")),
                                        theme : ".eevee",
                                        field : {title: "Game", ratings: "Ratings", cards: "Cards", archvment: "Archv", bundles: "BDL", lowest: "Lowest", retail: "Retail"},
                                        record : {title: "?", ratings: "?", cards: "?", archvment: "?", bundles: "?", lowest: "?", retail: "?"} });
                }
                $applet.steamCb("popUp")
                        .steamCb("addTable")
                        .steamCb("addGames", ids);
            }
        }
    }).appendTo($('.itcm-game-toolbox'));
}