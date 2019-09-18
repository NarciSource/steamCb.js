// ==UserScript==
// @name         ITCMhelper.steamCb
// @namespace    steamCb
// @version      0.1.21
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
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/src/dbs.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/src/ginfoBuilder.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/src/steamCb.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/src/tablesorter.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/src/exchange.js
// @resource     popup-layout https://raw.githubusercontent.com/NarciSource/steamCb.js/master/html/popup.html
// @resource     side-layout https://raw.githubusercontent.com/NarciSource/steamCb.js/master/html/side.html
// @resource     cb-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/cb.default.css
// @resource     table-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/table.default.css
// @resource     ts-style https://raw.githubusercontent.com/NarciSource/steamCb.js/master/css/tablesorter.css
// @resource     cm-style https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.8.0/jquery.contextMenu.css
// @resource     ms-style https://cdnjs.cloudflare.com/ajax/libs/magicsuggest/2.1.4/magicsuggest-min.css
// @resource     exchange-api https://earthquake.kr:23490/query/USDKRW
// @updateURL    https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/ITCMhelper.steamCb.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/ITCMhelper.steamCb.user.js
// @grant        GM.getResourceUrl
// @grant        GM.xmlHttpRequest
// @connect      api.steampowered.com
// @connect      api.isthereanydeal.com
// @license      MIT
// ==/UserScript==

;(function ($, window, document, undefined) {

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
            const headerRegex = /([\w-]+): (.*)/gi,
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

// Add stylesheet
const addStyle = async function(resource_url) {
    $('<link>', {
        rel : 'stylesheet',
        type : 'text/css',
        href : await GM.getResourceUrl(resource_url)
    }).appendTo('head');
};
addStyle("cb-style");
addStyle("ts-style");
addStyle("cm-style");
addStyle("ms-style");





(async function makeSideApplet() {
    let $side = $(await $.get(await GM.getResourceUrl("side-layout")));
    $side.steamCb({ idTag : "cb-0",
                    hyperlink : false,
                    style : await $.get(await GM.getResourceUrl("table-style")),
                    theme : '.itcm',
                    field : {title: "Game", cards: "C", archvment: "A", bundles: "B", lowest: "Lowest"},
                    record : {title: "?", cards: "?", archvment: "?", bundles: "?", lowest: "?"} });

    $('div.column_login').after($side);
})();


async function makeApplet() {
    return $(await $.get(await GM.getResourceUrl("popup-layout")))
            .appendTo('body')
            .steamCb({  idTag : "cb-1",
                        hyperlink : false,
                        style : await $.get(await GM.getResourceUrl("table-style")),
                        theme : '.eevee',
                        field : {title: "Game", ratings: "Ratings", cards: "Cards", archvment: "Archv", bundles: "BDL", lowest: "Lowest", retail: "Retail"},
                        record : {title: "?", ratings: "-", cards: "?", archvment: "?", bundles: "?", lowest: "?", retail: "?"} });
};

// Create a pop-up access button at the to
var $applet = undefined;
$('<li>', {
    html: $('<a>', {
            class: 'login_A',
            style: 'cursor:pointer',
            text: "차트만들기"}),
    on: {
        click: async function() {
            $applet = $applet || await makeApplet();

            $applet.steamCb("popUp");
        }
    }
}).appendTo($('.wrap_login').children('div'));


// Extract the game list of ITCM.
$('div.steam_read_selected').each(()=> {

    $('<div>', {
        class: 'itcm-game-toolbox',
        css: {'display': 'flex',
                'position': 'absolute',
                'margin': '0px 0px 0px 735px',
                'padding': '5px 10px 3px 0px',
                'background': 'rgb(51, 51, 51)',
                'border-radius': '0px 20px 20px 0px' }
    }).insertBefore($('div.steam_read_selected'));

    $('<div>', {
        class: 'fa fa-magic',
        title: 'Make a chart with steamCb.',
        css: {'padding-left': '10px',
              'color': 'white',
              'font-size': '15px',
              'line-height': '20px',
              'cursor': 'pointer' },
        on: {
            mouseenter: function() {
                $(this).animate({ deg: 360 }, {
                            duration: 600,
                            step: function(now) { $(this).css({ transform: `rotate(${now}deg)` }) },
                            complete: function() { $(this)[0].deg=0 }
                        }
                );
            },
            click: async function() {
                let gids = $('.steam_read_selected .item_content .name')
                            .map((idx, item) => {
                                const [match, div, id] = /steampowered\.com\/(\w+)\/(\d+)/.exec( $(item).attr('href') );
                                return {div,id};
                            }).toArray();

                $applet = $applet || await makeApplet();
                $applet.steamCb("popUp")
                        .steamCb("addTable");
                $applet.steamCb("addGames", gids);
            }
        }
    }).appendTo($('.itcm-game-toolbox'));
});

})( jQuery, window, document);