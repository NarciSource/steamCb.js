// @description  Change the amount in cb-table at the current exchange rate.
// @connect      earthquake.kr
;(async function() {
    const exchange_api = "https://earthquake.kr:23490/query/USDKRW",
          date = new Date();
    date.setHours(0, 0, 0, 0);

    if( localStorage["exchange"]===undefined || 
        date > new Date(JSON.parse(localStorage["exchange"]).date) ) {

        const exchange = $.ajax(exchange_api);

        localStorage["exchange"] = JSON.stringify({ date, exchange });
    }


    const exchange = JSON.parse(localStorage["exchange"]).exchange;
    $('.cb-table td')
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
})();