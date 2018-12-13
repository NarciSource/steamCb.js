// ==UserScript==
// @name         steamCb ITCM Helper
// @namespace    steamCb
// @version      0.1.4
// @description  Load steam game information and make charts.
// @author       narci <jwch11@gmail.com>
// @match        *://itcm.co.kr/*
// @require      http://code.jquery.com/jquery-3.2.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require      http://code.jquery.com/jquery-migrate-3.0.0.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/spin.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/themeCollection.js
// @require      https://raw.githubusercontent.com/NarciSource/steamCb.js/master/ginfoBuilder.js
// @updateURL    https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.ITCMhelper.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/steamCb.js/master/steamCb.ITCMhelper.user.js
// @connect      cdn.steam.tools
// @connect      api.isthereanydeal.com
// @connect      api.steamcardexchange.net
// @connect      spin.js.org
// @grant        none
// @license	     MIT
// ==/UserScript==



'use strict';

$("head").append(`<style type="text/css">
                    .highlight {color:#137ccf;}
                    </style>`);
var steamCb;
if( $(location).attr('href').match(/itcm.co.kr/)) {

    // Create a pop-up access button at the top
    $(`<li><a class="login_A eevee">
            <label id="lb-chart-make" style="cursor:pointer">차트만들기</label>
            <i title="Pop-Up" class="xi-toggle-on highlight" for="cb1"/>
        </a></li>`)
            .insertBefore($('li.first_login'))
            .children().children().first()
                .click(function() {
                    if(!steamCb) {
                        steamCb = new SteamCb({outline: "popup", style: localStorage.getItem("theme")});
                        $("div.column_login").after(steamCb.el);
                    }

                    // If pop-up is checked
                    if($(this).next().hasClass("xi-toggle-on")) {
                        steamCb.popUp({width:550, height:750});
                    } else {
                        steamCb.popDelete();
                    }
                })
            .next()
                .attr("style","cursor:pointer;margin:-3px")
                .click(function() {
                    $(this).toggleClass("xi-toggle-on")
                            .toggleClass("highlight")
                            .toggleClass("xi-toggle-off");
                });
    $("div.column_login").after((new SteamCb({outline: "side", style: "itcm"})).el);
        
            
    // Extract the game list of ITCM.
    if( $("div.steam_read_selected").length) {
        $(`<div align="right"><button id="takeITCMchart" style="cursor:pointer">추출</button></div>`)
            .insertBefore($("div.steam_read_selected table"))
            .click(() => {
                let gids = $(".steam_read_selected tbody .app > .item_image")
                            .map((idx, item) => $(item).attr("href").replace("/index.php?mid=g_board&app=",""))
                            .toArray();
                if(!steamCb) {
                    steamCb = new SteamCb({outline: "popup", style: "eevee"});
                    $(".column_login").after(steamCb.el);
                }

                steamCb.popUp({width:550, height:750});
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
}