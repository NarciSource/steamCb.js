// ==UserScript==
// @name         Lex's SG Chart Maker
// @namespace    https://www.steamgifts.com/user/lext
// @version      0.1.19
// @description  Create bundle charts for Steam Gifts.
// @author       Lex
// @match        *://store.steampowered.com/app/*
// @match        *://store.steampowered.com/sub/*
// @match        *://store.steampowered.com/bundle/*
// @require      http://code.jquery.com/jquery-3.2.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      api.isthereanydeal.com
// @connect      cdn.steam.tools
// @connect      api.steamcardexchange.net
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    //GM_deleteValue("gameOrder");
    //GM_deleteValue("games");
    if ("sets" in JSON.parse(GM_getValue("cardData", "{}"))) {
        console.log("Deleting old card data");
        GM_deleteValue("cardData");
    }
    var ITAD_API_KEY = GM_getValue("ITAD_API_KEY");
    const API_KEY_REGEXP = /[0-9A-Za-z]{40}/;
    const INVALIDATION_TIME = 60*60*1000; // 60 minute cache time
    const GameID = window.location.pathname.match(/(app|sub|bundle)\/\d+/)[0];
    const NOCV_ICON = "☠";
    const CARD_ICON = "❤"; // old icon: ?
    // other possiblities: "DailyIndieGame"
    const BUNDLE_BLACKLIST = ["Chrono.GG", "Chrono.gg", "Ikoid", "Humble Mobile Bundle", "PlayInjector", "Vodo",
                              "Get Loaded", "GreenMan Gaming", "Indie Ammo Box", "MacGameStore", "PeonBundle", "Select n'Play", "StackSocial",
                              "StoryBundle", "Bundle Central", "Cult of Mac", "GOG", "Gram.pl", "Indie Fort", "IUP Bundle", "Paddle",
                              "SavyGamer", "Shinyloot", "Sophie Houlden", "Unversala", "Indie Game Stand", "Fourth Wall Games"];

    $("head").append ('<link ' +
        'href="//ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/base/jquery-ui.min.css" ' +
        'rel="stylesheet" type="text/css">'
    );

    function getGames() { return JSON.parse(GM_getValue("games", '{}')); }
    function getGameOrder() { return JSON.parse(GM_getValue("gameOrder", '[]')); }

    function generateQuickGuid() { return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15); }

    function getCachedJSONValue(key, default_value, invalidation_time) {
        try {
            let result = JSON.parse(GM_getValue(key));
            if ((new Date()).getTime() - result.UPDATE_TIME < (invalidation_time || INVALIDATION_TIME))
                return result;
        } catch (err) { }
        return default_value;
    }

    function setCachedJSONValue(key, value) {
        value.UPDATE_TIME = (new Date()).getTime();
        GM_setValue(key, JSON.stringify(value));
    }

    function loadNoCV() {
        const noCVData = getCachedJSONValue("noCVData", undefined, 48*60*60*1000); // 48 hour cache time for nocv data
        if (noCVData !== undefined) {
            return handleNoCVData(noCVData);
        }
        console.log("Download new No CV data");
        GM_xmlhttpRequest({
            "method": "GET",
            "url": "https://script.google.com/macros/s/AKfycbym0nzeyr3_b93ViuiZRivkBMl9PBI2dTHQxNC0rtgeQSlCTI-P/exec",
            "onload": function(response) {
                const jresp = JSON.parse(response.responseText);
                if (jresp.success.apps) {
                    setCachedJSONValue("noCVData", jresp.success.apps);
                    handleNoCVData(jresp.success.apps);
                }
            }
        });
    }

    function fetchCardData() {
        const cachedCardData = getCachedJSONValue("cardData", undefined, 24*60*60*1000); // 24 hour cache time for card data
        if (cachedCardData !== undefined)
            return handleCardData(cachedCardData);
        GM_xmlhttpRequest({
            "method": "GET",
            //"url": "http://cdn.steam.tools/data/set_data.json",
            "url": "http://api.steamcardexchange.net/GetBadgePrices.json",
            "onload": function(response) {
                const jresp = JSON.parse(response.responseText);
                setCachedJSONValue("cardData", jresp);
                handleCardData(jresp);
            }
        });
    }

    function itad_api(url, callback) {
        GM_xmlhttpRequest({
            "method": "GET",
            "url": url,
            "onload": function(response) {
                callback(JSON.parse(response.responseText).data);
            }
        });
    }

    function itad_getplains(appids, callback) {
        itad_api("https://api.isthereanydeal.com/v01/game/plain/id/?key=" + ITAD_API_KEY + "&shop=steam&ids=" + appids.join(","), callback);
    }

    function itad_getbundles(plains, callback) {
        itad_api("https://api.isthereanydeal.com/v01/game/bundles/us/?key=" + ITAD_API_KEY + "&limit=-1&expired=1&plains=" + plains.join(","), callback);
    }

    function itad_getusprices(plains, callback) {
        itad_api("https://api.isthereanydeal.com/v01/game/lowest/us/?key=" + ITAD_API_KEY + "&country=US&plains=" + plains.join(","), callback);
    }

    // Functions for scraping data from an app page
    var appPage = {
        rating: function(context) {
            const rating = $("div[itemprop=aggregateRating]", context).attr('data-tooltip-text').replace(/(\d+)%[^\d]*([\d,]*).*/, "$1% of $2 reviews");
            if (rating.startsWith("Need more")) {
                let total = parseInt($("label[for=review_type_all]", context).text().match(/[\d,]+/)[0].replace(/,/g,''));
                let pos = parseInt($("label[for=review_type_positive]", context).text().match(/[\d,]+/)[0].replace(/,/g,''));
                return Math.round(100*pos/total) + `% of ${total} reviews`;
            } else
                return rating;
        },
        cards: () => Boolean($("img.category_icon[src$='ico_cards.png']").length),
        dlc: () => Boolean($(".game_area_dlc_bubble").length),
    };

    function handleCardData(jresp) {
        var games = getGames();
        for (let g of Object.values(games)) {
            if (!(g.appid in jresp))
                continue;
            const set = jresp[g.appid];
            g.card_count = set.Count;
            g.card_set_price = set.Normal;
            g.cards = true;
        }
        GM_setValue("games", JSON.stringify(games));
        dumpListing();
    }

    function handleNoCVData(apps) {
        var games = getGames();
        for (let g of Object.values(games)) {
            if (!(g.appid in apps))
                continue;
            g.noCV = apps[g.appid].noCV;
        }
        GM_setValue("games", JSON.stringify(games));
        dumpListing();
    }

    function addToGameOrder(gameid) {
        let gameOrder = getGameOrder();
        gameOrder.push(gameid);
        GM_setValue("gameOrder", JSON.stringify(gameOrder));

        loadNoCV();
    }

    // Add the current page's App to the chart
    // Does not work for package Subs
    function addAppToChart() {
        if (getGameOrder().includes(GameID)) // Game already in chart
            return;
        var game = {
            gameid: GameID,
            appid: window.location.pathname.split('/')[2],
            name: $(".apphub_AppName").text(),
            rating: appPage.rating(),
            cards: appPage.cards(),
            price: $.trim($(".game_area_purchase_game:first .price,.game_area_purchase_game:first .discount_original_price").text()),
            url: window.location.href,
            dlc: appPage.dlc(),
            bundles: undefined,
        };
        var games = getGames();
        games[GameID] = game;
        GM_setValue("games", JSON.stringify(games));

        addToGameOrder(GameID);
    }

    // elem: the div for the package listing on the main app's page
    function addPackageToChart(elem) {
        const subid = elem.find("input[name=subid]").attr("value");
        const gameid = "sub/" + subid;
        if (getGameOrder().includes(gameid))
            return;
        var game = {
            gameid: gameid,
            appid: subid,
            name: elem.find("h1")[0].childNodes[0].nodeValue.substring(4),
            rating: appPage.rating(),
            cards: appPage.cards(),
            price: $.trim(elem.find(".price,.discount_original_price").text()),
            url: window.location.protocol+"//store.steampowered.com/sub/" + subid,
            dlc: appPage.dlc(),
            bundles: undefined,
        };
        var games = getGames();
        games[gameid] = game;
        GM_setValue("games", JSON.stringify(games));

        addToGameOrder(gameid);
    }

    // Loads the rating for a gameid because sub pages do not have reviews
    // gameid is the gameid on the chart, appid is the Steam App ID to get the rating for
    function getGameRating(gameid, appid) {
        let url = window.location.protocol+"//store.steampowered.com/app/" + appid;
        GM_xmlhttpRequest({
            "method": "GET",
            "url": url,
            "onload": function(response) {
                const rating = appPage.rating(response.responseText);
                var games = getGames();
                let game = games[gameid];
                game.rating = rating;
                GM_setValue("games", JSON.stringify(games));
                dumpListing();
            }
        });
    }

    // elem: the div for the package listing on the sub's page
    function addSubToChart(elem) {
        const subid = elem.find("input[name=subid]").attr("value");
        const gameid = "sub/" + subid;
        if (getGameOrder().includes(gameid)) // sub id already in the chart
            return;
        var game = {
            gameid: gameid,
            appid: subid,
            name: elem.find("h1")[0].childNodes[0].nodeValue.substring(4),
            rating: "?",
            cards: appPage.cards(),
            price: $.trim(elem.find(".price,.discount_original_price").text()),
            url: window.location.protocol+"//store.steampowered.com/sub/" + subid,
            dlc: appPage.dlc(),
            bundles: undefined,
        };
        var games = getGames();
        games[gameid] = game;
        GM_setValue("games", JSON.stringify(games));

        // Submit an AJAX request to get the game's rating
        let appid = jQuery(".tab_item:first").attr("data-ds-appid");
        getGameRating(gameid, appid);

        addToGameOrder(gameid);
    }

    function addBundleToChart(elem) {
        const bundleid = elem.attr('data-ds-bundleid');
        const gameid = "bundle/" + bundleid;
        if (getGameOrder().includes(gameid)) // game id already in the chart
            return;
        var game = {
            gameid: gameid,
            appid: bundleid,
            name: $.trim(elem.find("h1")[0].childNodes[0].nodeValue.substring(4)),
            rating: "?",
            cards: appPage.cards(),
            price: $.trim(elem.find(".your_price div:not(.your_price_label):first").text()),
            url: window.location.protocol+"//store.steampowered.com/" + gameid,
            dlc: appPage.dlc(),
            bundles: undefined,
        };
        var games = getGames();
        games[gameid] = game;
        GM_setValue("games", JSON.stringify(games));

        addToGameOrder(gameid);
    }

    // Uses an ITAD call, then calls update_func on every response
    function itad_games_obj(itad_func, plainArr, update_func, callback) {
        var plains = Object.values(plainArr).filter(v => v !== null);
        itad_func(plains, function(list) {
            var games = getGames();
            for (let plain in list) {
                let gid = Object.keys(plainArr).find(key => plainArr[key] === plain); // reverse the dictionary to find the key from value
                let game = games[gid];
                update_func(game, plain, list[plain]);
            }
            GM_setValue("games", JSON.stringify(games));
            dumpListing();
            updateListing();
            callback();
        });
    }

    // Load prices from ITAD into the games object
    function loadPrices(plainArr) {
        itad_games_obj(itad_getusprices, plainArr, function(game, plain, data) {
            // Don't replace the price of bundles
            /*if (game.gameid.startsWith("bundle"))
                return;*/
            const steamShop = data.list.find(p => p.shop.id == "steam");
            if (steamShop !== undefined)
                game.price = "$" + steamShop.price_old;
            else
                console.log("Lex's SG Chart Maker Error: ITAD unable to find price for " + plain);
        }, function(){});
    }

    // Called from the Load Bundle Info button
    function loadBundleInfo() {
        const gameids = getGameOrder().filter(g => !g.startsWith("tier"));
        itad_getplains(gameids, function(plainArr){
            const errors = Object.keys(plainArr).filter(g => plainArr[g] === null).join(",");
            if (errors)
                console.log("Lex's SG Chart Maker Error: ITAD unable to find ids: " + errors);
            itad_games_obj(itad_getbundles, plainArr, function(game, plain, data) {
                game.bundlesUrl = data.urls.bundles;
                game.bundles = data.list.filter(function(b){
                    // Bundles not on blacklist and at least 48 hours old
                    return !BUNDLE_BLACKLIST.includes(b.bundle) && (Date.now()/1000 - b.start) > 48*60*60;
                }).length;
                game.plain = plain;
            }, function(){
                loadPrices(plainArr);
            });
        });
    }

    function showChartMaker() {
        if (!$("#lcm_dialog").length) {
            // Create the dialog
            GM_addStyle("#lcm_dialog { display: flex; flex-direction: column; } " +
                        "#lcm_dialog a { color: blue; text-decoration: underline; } " +
                        "#lcm_list { list-style-type: none; margin: 0 auto; padding: 0; width: 75%; }" +
                        "#lcm_dump { margin: 25px auto 0 auto; display: block; flex-grow: 1; resize: none; width: 95%; }" +
                        "#lcm_bundle_info { margin-bottom: 5px; }" +
                        "#lcm_itad { float: left; margin-bottom: 5px; }" +
                        "#lcm_center_btns { float:none; text-align: center; }");
            var d = $(`<div id="lcm_dialog"><div name="top-container">
                            <div id="lcm_itad">
                                <div>
                                    <a href="https://isthereanydeal.com/apps/mine/" target=_blank>IsThereAnyDeal API Key</a>: <input type="text"></input><button>Submit</button>
                                </div>
                                <a style="display:none" href="javascript:">Delete ITAD API Key?</a>
                                </div>
                                <div style="float: right"><button id="lcm_bundle_info" class="ui-button ui-widget ui-corner-all">Load Bundle Info</button></div>
                                <div id="lcm_center_btns">
                                    <button id="lcm_add_tier" class="ui-button ui-widget ui-corner-all">Add Tier</button>
                                    <label for="lcm_totals">Add Totals</label>
                                    <input type="checkbox" id="lcm_totals"/>
                                    <label for="lcm_card_prices">Add Card Prices</label>
                                    <input type="checkbox" id="lcm_card_prices"/>
                                    <button id="lcm_clear_chart" class="ui-button ui-widget ui-corner-all">Clear Chart</button>
                                </div>
                            </div>
                        <ul id="lcm_list"></ul>
                        <textarea id="lcm_dump"></textarea></div>`);
            $("body").append(d);
            if (GM_getValue("ITAD_API_KEY") !== undefined)
                $("#lcm_itad div,#lcm_itad a").toggle();
            // Add Totals button
            $("#lcm_totals").prop('checked', GM_getValue("addTotals", false))
            .button()
            .click(function(){
                GM_setValue("addTotals", $(this).prop('checked'));
                dumpListing();
            });
            // Load card prices button
            $("#lcm_card_prices").button().click(fetchCardData);
            // Load ITAD API key
            $("#lcm_itad button").click(function(){
                try{
                    ITAD_API_KEY = $("#lcm_itad input").val().match(API_KEY_REGEXP)[0];
                    GM_setValue("ITAD_API_KEY", ITAD_API_KEY);
                    $("#lcm_itad div,#lcm_itad a").toggle();
                }catch(err){
                    alert("Error setting API key");
                }
            });
            // Add tier button
            $("#lcm_add_tier").click(function(){
                addToGameOrder("tier-" + generateQuickGuid());
                updateListing();
                dumpListing();
            });
            // Delete API key button
            $("#lcm_itad a").click(function(){
                GM_deleteValue("ITAD_API_KEY");
                ITAD_API_KEY = undefined;
                $("#lcm_itad div,#lcm_itad a").toggle();
            });

            $("#lcm_dialog").dialog({
                modal: false,
                title: "Lex's SG Chart Maker v" + GM_info.script.version,
                position: {
                    my: "center",
                    at: "center",
                    of: window,
                    collusion: "none"
                },
                width: 800,
                height: 400,
                minWidth: 300,
                minHeight: 200,
                zIndex: 3666,
            })
            .dialog("widget").draggable("option", "containment", "none");
            $("#lcm_list").sortable({
                deactivate: function (event, ui) {
                    saveGameOrder();
                    dumpListing();
                }
            });
            $("#lcm_bundle_info").click(function(){
                loadBundleInfo();
                fetchCardData();
            });
            $("#lcm_clear_chart").click(function(){
                GM_deleteValue("gameOrder");
                GM_deleteValue("games");
                updateListing();
                dumpListing();
            });
        } else {
            $("#lcm_dialog").dialog();
        }
        updateListing();
        dumpListing();
    }

    function cardPricesEnabled() { return $("#lcm_card_prices").prop('checked'); }

    function updateListing() {
        $("#lcm_list").empty();
        var games = getGames();
        for (let id of getGameOrder()) {
            const p = (!id.startsWith("tier") && games[id].price) ? games[id].price : "?";
            const text = id.startsWith("tier") ? "Tier" : `<a href="${games[id].url}">${games[id].name}</a> - ${id} - ${p}`;
            $(`<li class="ui-state-default" data-appid="${id}">${text}<a href="javascript:" style="float:right; color:red; margin-top:-3px">✖</a></li>`)
            .appendTo("#lcm_list")
            .find("a:last").click(function(){ // Delete button
                deleteGame($(this).parent().attr("data-appid"));
                updateListing();
                dumpListing();
            });
        }
    }

    // Read order from the sortable and saves it
    function saveGameOrder() {
        const gameOrder = $("#lcm_list li").map((i,e) => e.getAttribute("data-appid")).get();
        if (gameOrder.concat().sort().join(",") !== getGameOrder().sort().join(",")) {
            alert("Chart data is out of date! Were you editing in a different tab? Reloading data from cache...");
            updateListing();
        } else
            GM_setValue("gameOrder", JSON.stringify(gameOrder));
    }

    function getProfit(cost) {
        const cf = 100;
        cost = cost * cf;
        if (cost < 22)
            return (cost - 2) / cf;
        if (cost < 33)
            return (cost - 3) / cf;
        return (cost * 0.85) / 100;
    }


    // Post chart code to the textarea
    function dumpListing() {
        const games = getGames();
        const cardPricesCol = cardPricesEnabled() ? "| Set Price (Profit) " : "";
        const header = `Game | Ratings | Cards ${cardPricesCol}| Bundled | Retail Price\n :- | :-: | :-: | :-: | :-:${cardPricesCol?" | :-:":""}\n`;

        var dump = header;
        if (getGameOrder().filter(g => g.startsWith("tier")).length)
            dump = `### **Tier 1**\n` + dump;
        var totals = [0]; // total prices
        var cardProfits = [0];
        var nocv_warning = false; // Show warning about No CV games
        let gameOrder = getGameOrder();
        for (let idx = 0; idx < gameOrder.length; idx++) {
            let gid = gameOrder[idx];
            if (gid.startsWith("tier")) {
                if (idx !== 0) {
                    cardProfits.push(0);
                    totals.push(0);
                }
                dump = (idx===0 ? "":dump+"\n") + `### **Tier ${totals.length}**\n${header}`;
                continue;
            }
            const g = games[gid];
            if (g === undefined)
                continue;
            nocv_warning = nocv_warning || g.noCV;
            totals[totals.length-1] += parseFloat(g.price ? g.price.replace(/\$/g,'') : "0.0");
            let link = `**[${g.name}](${g.url})**` + (g.dlc ? " (DLC)" : "") + (g.noCV?NOCV_ICON+' ':"");
            let cards = "-";
            if (g.cards) {
                cards = `[**${CARD_ICON}**](http://www.steamcardexchange.net/index.php?gamepage-appid-${g.appid})`;
                if (g.dlc)
                    cards = "(Base game has cards)";
            }
            let bundles = g.bundles !== undefined ? g.bundles : "?";
            if (g.bundlesUrl)
                bundles = "[" + bundles + "](" + g.bundlesUrl + ")";
            let price = g.price ? g.price : "?";
            price = g.plain ? "[" + price + "](https://isthereanydeal.com/#/page:game/info?plain=" + g.plain + ")" : price;

            let cardPrice = cardPricesEnabled() ? [""] : [];
            if (cardPricesEnabled() && g.card_count)
                try {
                    const profit = Math.round(g.card_count / 2) * getProfit(g.card_set_price / g.card_count);
                    cardProfits[cardProfits.length - 1] += profit;
                    const market = window.location.protocol+"//steamcommunity.com/market/search?category_753_Game%5B%5D=tag_app_"+g.appid+"&category_753_cardborder%5B%5D=tag_cardborder_0&category_753_item_class%5B%5D=tag_item_class_2&appid=753";
                    cardPrice[0] = `[x${g.card_count} = $${g.card_set_price} ($${profit.toFixed(2)})](${market})`;
                } catch(err) {}
            dump += [link, g.rating, cards, ...cardPrice, bundles, price].join(" | ");
            dump += "\n";
        }
        if (nocv_warning)
            dump += `${NOCV_ICON} - Game was free at some time and does not grant any CV if given away.`;
        if (GM_getValue("addTotals")) {
            if (totals.length > 1 && totals[0] === 0)
                totals.splice(0, 1); // Cut off empty first tier
            dump += "\n**Retail:**\n";
            let cv = "\n**CV:**\n";
            let cp = cardPricesEnabled() ? "\n**Card Farming Profit:**\n" : "";
            for (let i = 0; i < totals.length; i++) {
                let t = totals[i];
                const cumCost = totals.slice(0, i+1).reduce((p,c) => p + c, 0);
                const cumCardProfits = cardProfits.slice(0, i+1).reduce((p,c) => p + c, 0);
                const prep = totals.length === 1 ? `* ` : `* Tier ${[...Array(i+2).keys()].slice(1).join(" + ")} = `;
                cv += prep + `${(cumCost*0.15).toFixed(4)}\n`;
                dump += prep + `$${cumCost.toFixed(2)}\n`;
                if (cp)
                    cp += prep + `$${cumCardProfits.toFixed(2)}\n`;
            }
            dump += cv + cp + "\n";
        }
        dump += "Chart created with [Lex's SG Chart Maker](https://www.steamgifts.com/discussion/ed1gC/userscript-lexs-sg-chart-maker)\n";
        $("#lcm_dump").val(dump);
    }

    function deleteGame(aid) {
        if (aid == GameID) // Unmark the + Chart button
            $("#lcm_add_btn").removeClass("queue_btn_active");

        let gameOrder = getGameOrder();
        try {
            gameOrder.splice(gameOrder.indexOf(aid), 1);
            GM_setValue("gameOrder", JSON.stringify(gameOrder));
        }catch(err) {}

        let games = getGames();
        try {
            delete games[aid];
            GM_setValue("games", JSON.stringify(games));
        }catch(err) {}
    }

    function handleAppPage() {
        // Add button to app pages
        $(`<a id="lcm_add_btn" class="btnv6_blue_hoverfade btn_medium btn_steamdb"><span>+ <span style="position:relative;top:-1px">&#x229e;</span> Chart</span></a>`)
        .appendTo(`.apphub_OtherSiteInfo:first`)
        .click(function(){
            $(this).addClass("queue_btn_active");
            addAppToChart();
            showChartMaker();
        })
        .toggleClass("queue_btn_active", GameID in getGames());

        // Add buttons to Packages that include this game
        $(`<a href="javascript:"> +⊞ Chart</a>`).click(function(){
            addPackageToChart($(this).closest(".game_area_purchase_game_wrapper"));
            showChartMaker();
        }).appendTo(".game_area_purchase_game h1:not(:first)");
    }

    function handleSubPage() {
        // Add buttons to the package listing
        $(`<a href="javascript:"> +⊞ Chart</a>`).click(function(){
            addSubToChart($(this).closest(".game_area_purchase_game"));
            showChartMaker();
        }).appendTo(".game_area_purchase_game h1");
    }

    function handleBundlePage() {
        // Add buttons to the bundle listing
        $(`<a href="javascript:"> +⊞ Chart</a>`).click(function(){
            addBundleToChart($(this).closest(".game_area_purchase_game"));
            showChartMaker();
        }).appendTo(".game_area_purchase_game h1");
    }

    if (window.location.pathname.match(/app\/\d+/))
        handleAppPage();
    if (window.location.pathname.match(/sub\/\d+/))
        handleSubPage();
    if (window.location.pathname.match(/bundle\/\d+/))
        handleBundlePage();
})();