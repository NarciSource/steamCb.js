
/**
 * @method      GinfoBuilder
 * @description Makes information about the steam games.
 *              It is IIFE. It has three methods - build, getProduct, clear.
 * @example     GinfoBuilder.build(in-gids).then(out-gids, out-ginfo_bundle] => callback)
 */
GinfoBuilder = (function() {
    /**
     * @class       Ginfo
     * @classdesc   The type of data to send to user.
     */
    class Ginfo {
        constructor({name = "?",
                    gid = "?",
                    plain = "?",
                    trading_cards = "?", 
                    achievements = "?",
                    retail_price = "?", 
                    lowest_price = "?", 
                    bundles = "?",
                    reviews = "?",
                    is_dlc = "?",
                    is_package = "?"}) {
            this.name = name;
            this.gid = gid;
            this.plain = plain;
            this.trading_cards = trading_cards;
            this.achievements = achievements;
            this.retail_price = retail_price;
            this.lowest_price = lowest_price;
            this.bundles = bundles;
            this.reviews = reviews;
            this.is_dlc = is_dlc;
            this.is_package = is_package;
        }
        get url_store() {
            return "https://store.steampowered.com/app/"+this.gid; }
        get url_cards() {
            return "https://www.steamcardexchange.net/index.php?gamepage-appid-"+this.gid; }
        get url_archv() {
            return "https://astats.astats.nl/astats/Steam_Game_Info.php?AppID="+this.gid; }
        set url_price_info(url) {
            this._url_price_info = url; }
        get url_price_info() {
            return this._url_price_info || "#"; }
        set url_history(url) {
            this._url_history = url; }
        get url_history() {
            return this._url_history || "#"; }
        set url_bundles(url) {
            this._url_bundles=url; }
        get url_bundles() {
            return this._url_bundles || "#"; }
    }
    /** @typedef {Object.<number, Ginfo>} GinfoBundle */


        

    var getSteamworksAppDetail = (appid) => {
            return $.ajax({ //It can't support multiple appid. 400 times limit per a day.
                url: "https://store.steampowered.com/api/appdetails/?appids="+appid }); },
        getSteamworksPackageDetail = (subid) => { //store package, bundle
            return $.ajax({
                url: "https://store.steampowered.com/api/packagedetails/?packageids="+subid }); },
        getSteamworksAppList = () => {
            return $.ajax({ //Until now, get all appids and their names.
                //or replace http://api.steampowered.com/ISteamApps/GetAppList/v0002/ 
                url: "http://api.steampowered.com/ISteamApps/GetAppList/v0001/?format=json"}); },
        getSteamworksPrice = (appids, opt) => { //multiple, filter, but only price, Access-Control-Allow-Origin problem
            opt = opt || {currency:"kr",language:"kr"};
            return $.ajax({
                url: "https://store.steampowered.com/api/appdetails?appids="+appids.join()+"&cc="+opt.currency+"&l="+opt.language+"&filters=price_overview"});}

    var getITAD = (url) => {
        const itad_api_key = "a568e3c187a403c913321c49265cac341238d3af";
        return $.ajax({
            url: url.replace('%key%',itad_api_key) }); },
        getITADPlainList = () => {
            const store = "steam";
            return getITAD("https://api.isthereanydeal.com/v01/game/plain/list/?key=%key%&shops="+store); },
        getITADPlain = (gids) => {
            const store = "steam";
            return getITAD("https://api.isthereanydeal.com/v01/game/plain/id/?key=%key%&shop="+store+"&ids="+gids.map(item => "app/"+item).join()); },
        getITADInfo = (plains) => {
            return getITAD("https://api.isthereanydeal.com/v01/game/info/?key=%key%&plains="+plains); },
        getITADPrice = (plains) => { //It does not support Korean currency.
            return getITAD("https://api.isthereanydeal.com/v01/game/prices/?key=%key%&plains="+plains+"&shops=steam"); },
        getITADLowest = (plains) => {
            return getITAD("https://api.isthereanydeal.com/v01/game/lowest/?key=%key%&plains="+plains); },
        getITADBundles = (plains) => {
            return getITAD("https://api.isthereanydeal.com/v01/game/bundles/?key=%key%&plains="+plains); };



    /** @type {GinfoBundle} */
    var cache = {},
        meta = {};   //This is also a secondary cache.


    var loadBackup = function() {  //promise
            /* load applist */
            return getSteamworksAppList()
                .then(res=> {
                    res.applist.apps.app.forEach(app=> {
                        meta[app.appid] = new Ginfo({name:app.name, gid:app.appid});
                    });

                    console.log("Loads all steam applist.");
                    console.log("&nbsp;&nbsp;&nbsp;" + "Now, the number of steam apps is "+
                                res.applist.apps.app.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +".");

                    return Promise.resolve(); })
                .catch(err=> {
                    console.error("Steam api is inaccessible. "+ 
                                err.status + " " + err.statusText);
                    return Promise.reject("steam error"); })
                    
                .then(res=> getITADPlainList())
                .then(res=> {
                    Object.keys(res.data.steam).filter(gid => gid.match("app")).map(gid => {
                        const appid = gid.match(/[0-9]+/);
                        if(meta[appid]) 
                            meta[appid].plain = res.data.steam[gid];
                    });

                    console.log("Loads itad steam game's plain list");
                    
                    return Promise.resolve();
                })
                .catch(err=> {
                    if(err != "steam error") {
                        console.error("ITAD api is inaccessible. "+ 
                            err.status + " " + err.statusText);
                    }
                    return Promise.reject();
                });
            },

        loadInfo = function([gids, ginfo_bundle]) { //promise
            if(gids.length===0) return Promise.resolve({/*empty*/});
            else {
                let plains = gids.map(gid => ginfo_bundle[gid].plain);

                /* combine promise */
                let promises = [getITADPrice(plains.join()), //1)crrent price
                                getITADInfo(plains.join()), //2)additional information
                                getITADLowest(plains.join()), //3)lowest price
                                getITADBundles(plains.join())].map(promise =>  //4)number of bundles
                                    promise.then(d => ({success: true, d}), 
                                                err => ({success: false, err})));
                /* load infomation */
                return Promise.all(promises)
                    .then(([res_price, res_info, res_lowest, res_bundles]) => {
                        gids.forEach(gid => {
                            let ginfo = ginfo_bundle[gid];
                            let plain = ginfo.plain;

                            if(plain === "?") return;

                            try {
                                if(res_price.success) {
                                    ginfo.retail_price = res_price.d.data[plain].list[0].price_new;
                                } else throw "";
                            }catch(e) {
                                console.error("Can not read the price information.");
                            }

                            try {
                                if(res_info.success) {
                                    ginfo.trading_cards = res_info.d.data[plain].trading_cards;
                                    ginfo.achievements = res_info.d.data[plain].achievements;
                                    ginfo.url_price_info = res_info.d.data[plain].urls.game;
                                    ginfo.reviews = res_info.d.data[plain].reviews.steam; //ex.{"perc_positive": 94,"total": 154,"text": "Very Positive","timestamp": 1543913493}
                                    ginfo.is_dlc = res_info.d.data[plain].is_dlc;
                                    ginfo.is_package = res_info.d.data[plain].is_package;
                                } else throw "";
                            }catch(e) {
                                console.error("Can not read the trading cards and achievemts informaion.");
                            }

                            try {
                                if(res_lowest.success) {
                                    ginfo.lowest_price = res_lowest.d.data[plain].price;
                                    ginfo.url_history = res_lowest.d.data[plain].urls.history;
                                } else throw "";
                            }catch(e) {
                                console.error("Can not read the lowest price information.");
                            }

                            try {
                                if(res_bundles.success) {
                                    ginfo.bundles = res_bundles.d.data[plain].total;
                                    ginfo.url_bundles = res_bundles.d.data[plain].urls.bundles;
                                }else throw "";
                            }catch(e) {
                                console.error("Can not read the number of bundles information.");
                            }                               
                        });

                        return ginfo_bundle; })
                    .catch(err => {
                        console.error(err);
                        return {/*empty*/}; });
            }
            /* return ginfo_bundle */ },
        
        gidSelector = function(rqst_gids) {
            /* Detect errors */
            let rqst_err_gids = rqst_gids.filter(gid=> !meta[gid]);
            let rqst_errless_gids = rqst_gids.filter(gid=> !rqst_err_gids.includes(gid));

            /* Copy from 2st cache to 1st cache. */
            //let toward_gids = rqst_errless_gids.filter(gid=> !cache[gid]).filter(gid=> meta[gid].plain);
            //let toward_ginfo_bundle = toward_gids.reduce((pre,gid)=>{return Object.assign(pre, { [gid] : meta[gid] }); }, {});
            //Object.assign(cache, toward_ginfo_bundle); //cache += toward_ginfo_bundle

            /* Select gids that does not exist in the cache. */
            let sel_gids = rqst_errless_gids.filter(gid => !cache[gid]);
            let sel_ginfo_bundle = sel_gids.reduce((pre,gid)=>{return Object.assign(pre, { [gid] : meta[gid] }); }, {});

            console.log("request gids: "+rqst_gids+" ("+
                        "recycle: "+rqst_errless_gids.filter(gid=> !sel_gids.includes(gid))+" "+
                        "error: "+rqst_err_gids+" )");

            return ([rqst_errless_gids, [sel_gids, sel_ginfo_bundle]]); }



    //body
    return {
        /**
         * @method      build
         * @description 
         * @param       {number[]} rqst_gids   Request gids.
         * @return      {Promise<[number[], GinfoBundle]>} Returns the error removal gids and collected information.
         */
        build : function(rqst_gids) {
            /* Select gids that are no errors and needs to be updated. */
            const [rqst_errless_gids, selcted] = gidSelector(rqst_gids);

            return loadInfo(selcted)
                .then(res_ginfo_bundle => {
                    /* Back up results to cache */
                    Object.assign(cache, res_ginfo_bundle); //cache += res_ginfo_bundle

                    /* Choose from cache. */
                    let solution_ginfo_bundle = rqst_errless_gids.reduce((pre,gid)=>{return Object.assign(pre, { [gid] : cache[gid] }); }, {}) ;
                    
                    return ([rqst_errless_gids , solution_ginfo_bundle]); }); },
        preheat : function() {
            return loadBackup();
        },
        getProduct : function() {
            return cache; },

        clear : function() {
            cache.clear(); }
    };

})();