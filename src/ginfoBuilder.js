/**
 * GinfoBuilder - v0.2.6 - 2018-02-07
 * https://github.com/NarciSource/ginfoBuilder.js
 * Copyright 2018-2019. Narci. all rights reserved.
 * Licensed under the MIT license
 */


/**
 * @method      GinfoBuilder
 * @description Makes information about the steam games.
 *              It is IIFE. It has three methods - build, getProduct, clear.
 */
GinfoBuilder = (function() {
    /** @class       Ginfo
     *  @classdesc   The type of data to send to user. */
    class Ginfo {
        constructor(gdata) {
            const defaults = {
                id : undefined,
                div : undefined,
                name : undefined,
                plain : undefined,

                retail_price : undefined,

                trading_cards : undefined,
                achievements : undefined,
                
                is_dlc : undefined,
                is_package : undefined,
                is_early_access : undefined,

                reviews : undefined,
                bundles : undefined,
                lowest_price : undefined,
                store_price : undefined,

                urls: undefined
            };
            Object.assign(this, defaults, gdata);
        }

        get urls_store() {
            return `https://store.steampowered.com/${this.div}/${this.id}`; }
        get urls_cards() {
            return `https://www.steamcardexchange.net/index.php?gamepage-appid-${this.id}`; }
        get urls_archv() {
            return `https://astats.astats.nl/astats/Steam_Game_Info.php?AppID=${this.id}`; }
        get urls_img() {
            if (this.div === "app" || this.div === "sub") {
                return `https://steamcdn-a.akamaihd.net/steam/${this.div}s/${this.id}/capsule_184x69.jpg`; 
            } else {
                return `https://steamstore-a.akamaihd.net/public/shared/images/header/globalheader_logo.png`;
            }
        }
    }


    /**
     * @typedef {{id:number, div:string}} gid
     * @typedef {gid[]} gids
     * @typedef {{id:number, div:string, name:string, plain:string}} gdata
     * @typedef {gdata[]} glist
     * @typedef {{...gdata:gdata, etc:any}} ginfoEX
     * @typedef {ginfoEX[]} glistEX
     */
        

    var getSteamworksAppDetail = (appid) => {
            return $.ajax({ //It can't support multiple appid. 400 times limit per a day.
                url: `https://store.steampowered.com/api/appdetails/?appids=${appid}` }); },
        getSteamworksPackageDetail = (subid) => { //store package, bundle
            return $.ajax({
                url: `https://store.steampowered.com/api/packagedetails/?packageids=${subid}` }); },
        getSteamworksAppList = () => {
            return $.ajax({ //Until now, get all appids and their names.
                url: `http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json`}); },
        getSteamworksPrice = (appids, opt) => { //multiple, filter, but only price, Access-Control-Allow-Origin problem
            opt = opt || {currency:"kr",language:"kr"};
            return $.ajax({
                url: `https://store.steampowered.com/api/appdetails?appids=${appids.join()}&cc=${opt.currency}&l=${opt.language}&filters=price_overview`});}

    var getITAD = (url) => {
            const itad_api_key = "a568e3c187a403c913321c49265cac341238d3af"; //mykey
            return $.ajax({
                url: url.replace('%key%',itad_api_key) }); },
        getITADPlainList = () => {
            const store = "steam";
            return getITAD(`https://api.isthereanydeal.com/v01/game/plain/list/?key=%key%&shops=${store}`); },
        getITADPlain = (gids) => {
            const store = "steam";
            return getITAD(`https://api.isthereanydeal.com/v01/game/plain/id/?key=%key%&shop=${store}&ids=${gids.map(item=>"app/"+item).join()}`); },
        getITADInfo = (plains) => {
            return getITAD(`https://api.isthereanydeal.com/v01/game/info/?key=%key%&plains=${plains}`); },
        getITADPrice = (plains) => { //It does not support Korean currency.
            const store = "steam";
            return getITAD(`https://api.isthereanydeal.com/v01/game/prices/?key=%key%&plains=${plains}&shops=${store}`); },
        getITADLowest = (plains) => {
            return getITAD(`https://api.isthereanydeal.com/v01/game/lowest/?key=%key%&plains=${plains}`); },
        getITADBundles = (plains) => {
            return getITAD(`https://api.isthereanydeal.com/v01/game/bundles/?key=%key%&plains=${plains}`); },
        getITADOverview = (plains) => {
            const store = "steam";
            return getITAD(`https://api.isthereanydeal.com/v01/game/overview/?key=%key%&plains=${plains}&shop=${store}`); };



    /** @type {glistEX} */
    var cache = {
            get: function(gid) {
                return JSON.parse(sessionStorage.getItem(gid.div+"/"+gid.id));
            },
            set: function(glistEX) {
                glistEX.forEach(ginfo => 
                    sessionStorage.setItem(ginfo.div+"/"+ginfo.id, JSON.stringify(ginfo)));
                return this;
            }
        };


    /** @function    initLoad (async)
     *  @description Load init data.
     *  @return      {Promise<glist>} Regular name and plain based on gid. */
    async function initLoad() {
        /* Load from ITAD api */
        try {
            var plainlist = await getITADPlainList();

            console.info("Loads itad steam game's plain list");
        } catch(err) {
            console.warn("ITAD api is inaccessible. "+ 
                        err.status + " " + err.statusText);

            return [[/*empty*/],[/*empty*/],[/*empty*/]];
        }

        try {
            var steamworksapplist = await getSteamworksAppList();

            console.info("Loads steam games all list");
        } catch(err) {
            console.warn("Steam api is inaccessible. "+ 
                        err.status + " " + err.statusText);

            return [[/*empty*/],[/*empty*/],[/*empty*/]];
        }
        
        var steamlist = {};
        steamworksapplist.applist.apps.forEach(app => {
            steamlist[app.appid] = app.name;
        });

        var applist = Object.keys(plainlist.data.steam).filter(id=>/^app/.test(id)).map(id=> ({
                id : id.replace(/^app\//,""),
                div : "app",
                plain : plainlist.data.steam[id],
                name : steamlist[id.replace(/^app\//,"")] }) ),
            sublist = Object.keys(plainlist.data.steam).filter(id=>/^sub/.test(id)).map(id=> ({
                id : id.replace(/^sub\//,""),
                div : "sub",
                plain : plainlist.data.steam[id] }) ),
            bundlelist = Object.keys(plainlist.data.steam).filter(id=>/^bundle/.test(id)).map(id=> ({
                id : id.replace(/^bundle\//,""),
                div : "bundle",
                plain : plainlist.data.steam[id] }) );
                
        return [applist, sublist, bundlelist];
    };

    /** @function    loadBase (async)
     *  @description Check whether there is data in db, and if not, load it.
     *  @return      {boolean} */
    async function loadBase() {
        if( !await idxDB.isEmpty() ) {
            return true;
        } else {
            /* Import data from outside */
            const [applist, sublist, bundlelist] = await initLoad();
            /* Write the data in DB */
            idxDB.write("app", applist );
            idxDB.write("sub", sublist );
            idxDB.write("bundle", bundlelist );
            return true;
        }
    };


    /** @function    gidSelector (async)
     *  @description Select gids that are no errors and needs to be updated.
     *  @param       {gids} rqst_gids   Gids requested by the user.
     *  @return      {glist} */
    async function gidSelector(rqst_gids) {
        const promises= ["app","sub","bundle"].map(async div=> {
            const whole = rqst_gids.filter(gid=>gid.div===div).map(gid=>gid.id),
                  needs = whole.filter(id=>!cache.get({div,id})); //needs = whole not in cache

                  glist = await idxDB.read(div, needs);

                  load = glist.map(gdata=>gdata.id), //load = needs in db
                  recycle = whole.filter(id=>!needs.includes(id)), //recycle = whole - needs
                  error = needs.filter(id=>!load.includes(id)); //error = needs - load

            if (load.length + recycle.length + error.length > 0) {
                console.info(`(${div}) load: ${load} / recycle: ${recycle} / error: ${error}`);
            }
            return glist;
        });
        return (await Promise.all(promises)).flat();
    };


    /** @function    loadMore (async)
     *  @description Load more data from itad api.
     *  @param       {glist} glist Base data
     *  @return      {glistEX} Expanded data */
    async function loadMore(glist) {
        if(glist.length) {
            const plains = glist.map(gdata => gdata.plain),

                  /* combine promise */
                  promises = [getITADPrice(plains.join()), //1)crrent price
                              getITADInfo(plains.join()), //2)additional information
                              getITADOverview(plains.join())].map(promise =>  //4)number of bundles
                                    promise.then(d => ({success: true, d}), 
                                                err => ({success: false, err})));
            /* load infomation */
            const [res_price, res_info, res_overview] = await Promise.all(promises);

            glist = glist.map(source => {
                let gdata = JSON.parse(JSON.stringify(source));
                const plain = gdata.plain;

                try {
                    if(res_price.success) {
                        Object.assign( gdata, {
                            retail_price : res_price.d.data[plain].list[0].price_old
                        });
                    } else throw res_price.err;
                }catch(e) {
                    console.warn(gdata.div +"/"+ gdata.id + " Can not read the price information.");
                }

                try {
                    if(res_info.success) {
                        Object.assign( gdata, {
                            trading_cards : res_info.d.data[plain].trading_cards,
                            achievements : res_info.d.data[plain].achievements,
                            reviews : res_info.d.data[plain].reviews,
                            is_dlc : res_info.d.data[plain].is_dlc,
                            is_package : res_info.d.data[plain].is_package,
                            is_early_access : res_info.d.data[plain].early_access
                        });
                    } else throw res_info.err;
                }catch(e) {
                    console.warn(gdata.div +"/"+ gdata.id + " Can not read the trading cards and achievemts informaion.");
                }

                try {
                    if(res_overview.success) {
                        Object.assign( gdata, {
                            lowest_price : res_overview.d.data[plain].lowest,
                            store_price : res_overview.d.data[plain].price,
                            bundles : res_overview.d.data[plain].bundles,
                            urls : res_overview.d.data[plain].urls
                        });
                    } else throw res_overview.err;
                }catch(e) {
                    console.warn(gdata.div +"/"+ gdata.id + " Can not read the overview informaion.");
                }

                return gdata;
            });
        }
        return glist;
    };
     
    
    /** @function    dataProcessing
     *  @description Process the data into informaion
     *  @param       {glistEX} glist
     *  @return      {Ginfo[]} ginfo list */
    function dataProcessing(glist) {
        return ginfolist = glist.map(gdata => new Ginfo(gdata) ); //covered
    }


    /** @function    resultSelector
     *  @param       {gids} rqst_gids Requested gids for user.
     *  @param       {glistEX} cache
     *  @return      {glistEX} Selected glist. */
    function resultSelector(rqst_gids, cache) {
        return rqst_gids.filter(cache.get).map(cache.get);
    }
        



    //body
    return {
        /** @method      build (async)
         *  @description Build information based on the request gids.
         *  @param       {gids} rqst_gids   Request gids.
         *  @return      {Promise<ginfolist>} Returns collected information.*/
        build : async function(rqst_gids) {
            await   loadBase();
            return  gidSelector(rqst_gids).then(selcted_glist => 
                    loadMore(selcted_glist)).then(extend_glist => 
                    cache.set(extend_glist)).then(cache =>
                    resultSelector(rqst_gids,cache)).then(result_glist =>
                    dataProcessing(result_glist));
        },

        /** @method      preheat (async)
         *  @description Preparations. Aggressive Initialization.
         *  @return      {Promise<boolean>} */
        preheat : function() {
            return loadBase();
        },

        /** @method      getProduct
         *  @return      {ginfolist} cache */
        getProduct : function() {
            return cache;
        },

        clear : function() {
            cache.clear();
        }
    };
})();