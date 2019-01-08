// ==UserScript==
// @name         exchange.steamCb
// @namespace    steamCb
// @version      0.1.0
// @description  Change the amount in cb-table at the current exchange rate.
// @author       narci <jwch11@gmail.com>
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @resource     exchange-api http://earthquake.kr/exchange/
// @updateURL    https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/exchange.steamCb.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/steamCb.js/master/userscript/exchange.steamCb.user.js
// @grant        GM.getResourceUrl
// ==/UserScript==

// Greasemonkey is a sandbox, but not tempermonkey, jquery crash prevention.
this.$ = window.jQuery.noConflict(true);

'use strict';
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
            exchange : exchange[0]
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