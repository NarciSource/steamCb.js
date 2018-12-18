/**
 * GinfoBuilder - v0.2.4 - 2018-12-16
 * https://github.com/NarciSource/ginfoBuilder.js
 * Copyright 2018. Narci. all rights reserved.
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
            this.name = "?";
            this.gid = "?";
            this.plain = "?";
            this.reviews_perc = "?";
            this.reviews_text = "?";
            this.trading_cards = "?";
            this.achievements = "?";
            this.retail_price = "?";
            this.lowest_price = "?";
            this.bundles = "?";
            this.reviews = "?";
            this.is_dlc = "?";
            this.is_package = "?";

            Object.assign(this, gdata);
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


    /**
     * @typedef {number[]} gids
     * @typedef {{name:string, plain:string}} gdata
     * @typedef {gdata[]} glist
     * @typedef {{name:string, plain:string, achievements:boolean}} ginfoEX
     * @typedef {ginfoEX[]} glistEX
     */
        

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
        const itad_api_key = "a568e3c187a403c913321c49265cac341238d3af"; //mykey
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



    /** @type {glistEX} */
    var cache = {
        get: function(gid) {
            return JSON.parse(sessionStorage.getItem(gid));
        },
        set: function(glist) {
            glist.forEach(gdata => 
                sessionStorage.setItem(gdata.gid, JSON.stringify(gdata)));
            return this;
        }};


    /** @function    externalLoad (async)
     *  @description Load basic data from steam and itad api.
     *  @return      {Promise<glist>} Regular name and plain based on gid. */
    async function externalLoad() {
        /* Load from Steam api */
        try {
            var applist = await getSteamworksAppList();
            applist = applist.applist.apps.app;

            console.log("Loads all steam applist.");
            console.log("&nbsp;&nbsp;&nbsp;" + "Now, the number of steam apps is "+
                        applist.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +".");
        } catch(err) {
            console.error("Steam api is inaccessible. "+ 
                        err.status + " " + err.statusText);

            return [/*empty*/];
        }

        /* Load from ITAD api */
        try {
            var plainlist = await getITADPlainList();

            console.log("Loads itad steam game's plain list");
        } catch(err) {
            console.error("ITAD api is inaccessible. "+ 
                        err.status + " " + err.statusText);

            return [/*empty*/];
        }
        
        /* Combining the both data */
        return applist.map(app=> ({
            gid: String(app.appid),
            name: app.name,
            plain: plainlist.data.steam["app/"+app.appid] })
        );
    };


    /** @function    loadBase (async)
     *  @description Check whether there is data in db, and if not, load it.
     *  @return      {Promise<boolean>} */
    async function loadBase() {
        try {
            if( await idxDB.isExist() ) {
                return true;
            } else {
                /* Import data from outside */
                const glist = await externalLoad();
                /* Write the data in DB */
                idxDB.write( glist );
                return true;
            }
        } catch(_) { 
            console.error("Error in isExist of IndexedDB."); 
        }
    };


    /** @function    gidSelector (async)
     *  @description Select gids that are no errors and needs to be updated.
     *  @param       {gids} rqst_gids   Gids requested by the user.
     *  @return      {Promise<glist>} */
    async function gidSelector(rqst_gids) {
        const need_gids = rqst_gids.filter(gid => !cache.get(gid));
        
        const glist = await idxDB.read(need_gids);
        
        console.log("request gids: "+rqst_gids+" ("+
                    "recycle: "+rqst_gids.filter(gid=>cache.get(gid))+" "+
                    "load: "+glist.map(gdata=>gdata.gid)+" else error)");
                        
        return glist;
    };


    /** @function    loadMore (async)
     *  @description Load more data from itad api.
     *  @param       {glist} glist Base data
     *  @return      {glistEX} Expanded data */
    async function loadMore(glist) {
        if(glist.length!==0) {
            const plains = glist.map(gdata => gdata.plain);

            /* combine promise */
            const promises = [getITADPrice(plains.join()), //1)crrent price
                              getITADInfo(plains.join()), //2)additional information
                              getITADLowest(plains.join()), //3)lowest price
                              getITADBundles(plains.join())].map(promise =>  //4)number of bundles
                                    promise.then(d => ({success: true, d}), 
                                                err => ({success: false, err})));
            /* load infomation */
            const [res_price, res_info, res_lowest, res_bundles] = await Promise.all(promises);

            glist.forEach(gdata => {
                const plain = gdata.plain;

                try {
                    if(res_price.success) {
                        gdata.retail_price = res_price.d.data[plain].list[0].price_new;
                    } else throw "";
                }catch(e) {
                    console.error("Can not read the price information.");
                }

                try {
                    if(res_info.success) {
                        gdata.trading_cards = res_info.d.data[plain].trading_cards;
                        gdata.achievements = res_info.d.data[plain].achievements;
                        gdata.url_price_info = res_info.d.data[plain].urls.game;
                        gdata.reviews_perc = res_info.d.data[plain].reviews.steam.perc_positive;
                        gdata.reviews_text = res_info.d.data[plain].reviews.steam.text;
                        gdata.is_dlc = res_info.d.data[plain].is_dlc;
                        gdata.is_package = res_info.d.data[plain].is_package;
                    } else throw "";
                }catch(e) {
                    console.error("Can not read the trading cards and achievemts informaion.");
                }

                try {
                    if(res_lowest.success) {
                        gdata.lowest_price = res_lowest.d.data[plain].price;
                        gdata.url_history = res_lowest.d.data[plain].urls.history;
                    } else throw "";
                }catch(e) {
                    console.error("Can not read the lowest price information.");
                }

                try {
                    if(res_bundles.success) {
                        gdata.bundles = res_bundles.d.data[plain].total;
                        gdata.url_bundles = res_bundles.d.data[plain].urls.bundles;
                    } else throw "";
                }catch(e) {
                    console.error("Can not read the number of bundles information.");
                }                               
            });
        }

        return glist;
    };
     
    
    /** @function    dataProcessing
     *  @description Process the data into informaion
     *  @param       {glistEX} glist
     *  @return      {ginfolist} ginfo list */
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








var idxDB = (function() {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
    // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")
    }

    var db;
    const dbName = "ginfoDB";
    const version = 1;
    const dbTable = "ginfoTable";
    const primaryKey = "gid";
    //const candidateKey = "plain";

    var loadDB = function() {
        if(db === undefined) {
            return new Promise(function(resolve, reject) {
                let request = window.indexedDB.open( dbName, version);
                request.onsuccess = function(res) {
                    db = res.target.result;
                    console.log("request success");
                    resolve();
                }
                request.onerror = function(res) {
                    window.alert("Database error: " + res.target.errorCode);
                }
                request.onupgradeneeded = function(res) { // upgrade.then=>success
                    db = res.target.result;
                    console.log("request upgrade");
                    
                    let objectStore = db.createObjectStore( dbTable, {keyPath: primaryKey});
                    //objectStore.createIndex(candidateKey, candidateKey, { unique: true });
                }
            });
        } else {
            return Promise.resolve();
        }
    };
    

    return {
        write: async function(objects) {
            await loadDB();

            return new Promise(function(resolve, reject) {
                let transaction = db.transaction(dbTable, "readwrite");
                transaction.oncomplete = ()=> { //callback
                    console.log("Write transaction success");
                    resolve();
                }
                transaction.onerror = () => {
                    console.error("Write transaction error");
                    reject();
                }
                let objectStore = transaction.objectStore(dbTable);

                objects.forEach(object => {
                    objectStore.add(object);
                });
            });
        },
        read: async function(keys) {
            await loadDB();
            var objects = [];

            return new Promise(function(resolve, reject) {
                let transaction = db.transaction(dbTable, "readonly");
                    transaction.oncomplete = ()=> {
                        //console.log("Read transaction success");
                        resolve(objects);
                    }
                    transaction.onerror = () => {
                        console.error("Read transaction error");
                        reject();
                    }
                let objectStore = transaction.objectStore(dbTable);

                keys.forEach(key => {
                    var readRequest = objectStore.get(key);
                    readRequest.onsuccess = function(event) {
                        if(event.target.result !== undefined) {
                            objects.push( event.target.result );
                        }
                    };
                });
            });
        },
        readAll: async function(dataType) {
            await loadDB();
            var objects = [];

            return new Promise(function(resolve, reject) {
                let transaction = db.transaction(dbTable, "readwrite");
                    transaction.oncomplete = ()=> {
                        //console.log("ReadAll transaction success");
                    }
                    transaction.onerror = () => {
                        console.error("ReadAll transaction error");
                    }
                let objectStore = transaction.objectStore(dbTable);
                objectStore.openCursor().onsuccess = function(event) {
                    var cursor = event.target.result;
                    if( cursor ) {
                        objects.push( dataType(cursor.value) );
                        cursor.continue();
                    } else {
                        resolve(objects);
                    }
                    
                }
            });
        },
        isExist: async function() {
            await loadDB();

            return new Promise(function(resolve, reject) {
                    let objectStore = db.transaction(dbTable, "readonly").objectStore(dbTable);
                    objectStore.count().onsuccess = function(event) {
                        resolve(event.target.result !== 0);
                    };
                });
        },
        clear: async function() {
            await loadDB();

            return new Promise(function(resolve, reject) {
                let objectStore = db.transaction(dbTable, "readwrite").objectStore(dbTable);
                objectStore.clear().onsuccess = function() {
                    //console.log("Clear transaction success");
                    resolve();
                }
            });
        }
    }
    
})();