// ==UserScript==
// @name         exchange.steamCb
// @namespace    steamCb
// @version      0.1.1
// @description  Change the amount in cb-table at the current exchange rate.
// @author       narci <jwch11@gmail.com>
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @resource     exchange-api https://earthquake.kr:23490/query/USDKRW
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