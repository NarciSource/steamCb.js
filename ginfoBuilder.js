/**
 * GinfoBuilder - v0.2.0 - 2018-12-10
 * https://github.com/NarciSource/ginfoBuilder.js
 * Copyright 2018. Narci. all rights reserved.
 * Licensed under the MIT license
 */


/**
 * @method      GinfoBuilder
 * @description Makes information about the steam games.
 *              It is IIFE. It has three methods - build, getProduct, clear.
 * @example     GinfoBuilder.build(in-gids).then(out-gids, out-ginfo_bundle] => callback)
 */
GinfoBuilder = (function() {
    /** @class       Ginfo
     *  @classdesc   The type of data to send to user. */
    class Ginfo {
        constructor(gdata) {
            this.name = "?";
            this.gid = "?";
            this.plain = "?";
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
     * @typedef {{gid: gdata}} gbundle
     * @typedef {{name:string, plain:string, achievements:boolean}} ginfoEX
     * @typedef {ginfoEX[]} glistEX
     * @typedef {{gid: ginfoEX}} gbundleEX
     * @typedef {{gid: Ginfo}} ginfobundle
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



    /** @type {ginfobundle} */
    var cache = {};


    /** @function    externalLoad (async)
     *  @description Load basic data from steam and itad api.
     *  @return      {Promise<glist>} Regular name and plain based on gid. */
    function externalLoad() {
            /* Load from Steam api */
        let loadAppList = getSteamworksAppList() 
                .then(res=> {
                    let data = {/*gid:full_name*/};
                    res.applist.apps.app.forEach(app=> {
                        data[app.appid] = app.name;
                    });

                    console.log("Loads all steam applist.");
                    console.log("&nbsp;&nbsp;&nbsp;" + "Now, the number of steam apps is "+
                                res.applist.apps.app.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +".");
                                
                    return Promise.resolve(data);
                })
                .catch(err=> {
                    console.log(err);
                    console.error("Steam api is inaccessible. "+ 
                                err.status + " " + err.statusText);
                    return Promise.reject(); 
                }),


            /* Load from ITAD api */
            loadPlainList = getITADPlainList()
                .then(res=> {
                    let data = {/*gid:plane_name*/};
                    Object.keys(res.data.steam).filter(gid => gid.match("app")).map(gid => {
                        const appid = gid.match(/[0-9]+/);
                        data[appid] = res.data.steam[gid];
                    });

                    console.log("Loads itad steam game's plain list");
                    
                    return Promise.resolve(data);
                })
                .catch(err=> {
                    console.error("ITAD api is inaccessible. "+ 
                        err.status + " " + err.statusText);
                    return Promise.reject();
                });


            /* Combining the both data */
        return Promise.all([loadAppList, loadPlainList])
                .then((full_name, plain_name) => {
                    let intersection_gid = Object.keys(full_name)
                                            .concat(Object.keys(plain_name))
                                            .sort()
                                            .reduce((pre, gid, i, self) => {
                                                if(i && self[i-1] === gid) //twice
                                                    pre.push(gid);
                                                return pre;
                                            } , [/*init*/]);

                    let combined_data = intersection_gid
                                            .filter(full_name[gid] && plain_name[gid])
                                            .map(gid => {
                                                return {  gid: gid,
                                                        name: full_name[gid],
                                                        plain: plain_name[gid] }; });
                    return combined_data;
                });
    };


    /** @function    loadBase (async)
     *  @description Check whether there is data in db, and if not, load it.
     *  @return      {Promise<boolean>} */
    function loadBase() {
        return new Promise(function(resolve, reject) {
            idDB.isExist()
                .then(isExist => {
                    if(isExist) {
                        resolve(true);                        
                    } else {
                        /* Import data from outside */
                        externalLoad()
                            .then(res => {
                                console.log("externalLoad");
                                /* Write the data in DB */
                                idDB.write( res ) //async
                                    .then(()=>{/*success*/})
                                    .catch(()=>{/*error*/});
                                resolve(true);
                            })
                            .catch(() => reject(false));
                    }
                })
                .catch(()=> {
                    reject(false);
                });
        }); 
    };


    /** @function    gidSelector (async)
     *  @description Select gids that are no errors and needs to be updated.
     *  @param       {gids} rqst_gids   Gids requested by the user.
     *  @return      {Promise<gbundle>} */
    function gidSelector(rqst_gids) {
        const need_gids = rqst_gids.filter(gid => !cache[gid]);
        
        return  idDB.read(need_gids)
                    .then(glist => {

                        let gbundle = glist.reduce((pre, gdata) => //bundle is indexed list
                                Object.assign(pre, { [gdata.gid] : gdata }), {/*init*/} );
                                
                        console.log("request gids: "+rqst_gids+" ("+
                                    "recycle: "+rqst_gids.filter(gid=>cache[gid])+" "+
                                    "error: "+rqst_gids.filter(gid=>!cache[gid] && !gbundle[gid])+" )");
                        
                        return gbundle;
                    });
    };


    /** @function    loadMore (async)
     *  @description Load more data from itad api.
     *  @param       {gbundle} gbundle Base data
     *  @return      {gbundleEX} Expanded data */
    function loadMore(gbundle) {
        var gids = Object.keys(gbundle);

        if(gids.length===0) return Promise.resolve({/*empty*/});
        else {
            let plains = gids.map(gid => gbundle[gid].plain);

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
                        let gdata = gbundle[gid];
                        let plain = gdata.plain;

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
                                //gdata.reviews = res_info.d.data[plain].reviews.steam; //ex.{"perc_positive": 94,"total": 154,"text": "Very Positive","timestamp": 1543913493}
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
                            }else throw "";
                        }catch(e) {
                            console.error("Can not read the number of bundles information.");
                        }                               
                    });

                    return gbundle; })
                .catch(err => {
                    console.error(err);
                    return {/*empty*/}; });
        }
    };
     
    
    /** @function    dataProcessing
     *  @description Process the data into informaion
     *  @param       {gbundleEX} gbundle
     *  @return      {ginfobundle} ginfo bundle */
    function dataProcessing(gbundle) {
        return ginfobundle = Object.keys(gbundle).reduce((pre, gid) => {
                                let gdata = gbundle[gid];
                                Object.assign(pre, { [gdata.gid] : new Ginfo(gdata) }); //covered
                                return pre;
                            }, {/*init*/})
    }


    /** @function    save
     *  @description Save to cache
     *  @param       {ginfobundle} ginfobundle
     *  @return      {ginfobundle} cache. */
    function save(ginfobundle) {
        /* Back up results to cache */
        Object.assign(cache, ginfobundle); //cache += result_gbundle
        return cache;
    }
        



    //body
    return {
        /** @method      build (async)
         *  @description Build information based on the request gids.
         *  @param       {gids} rqst_gids   Request gids.
         *  @return      {Promise<glistEX>} Returns collected information.*/
        build : function(rqst_gids) {
            return  loadBase().then(()=>
                    gidSelector(rqst_gids)).then(selcted_gbundle => 
                    loadMore(selcted_gbundle)).then(extend_gbundle => 
                    dataProcessing(extend_gbundle)).then(ginfobundle =>
                    save(ginfobundle)).then(cache =>
                    rqst_gids.filter(gid => cache[gid]).map(gid => cache[gid]));
        },

        /** @method      preheat (async)
         *  @description Preparations are necessary before build method.
         *  @return      {Promise<boolean>} */
        preheat : function() {
            return loadBase();
        },

        /** @method      getProduct
         *  @return      {gbundleEX} cache */
        getProduct : function() {
            return cache; },

        clear : function() {
            cache.clear(); }
    };

})();








var idDB = (function() {
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


    let request = window.indexedDB.open( dbName, version);
    request.onsuccess = function(res) {
        db = res.target.result;
        console.log("request success");
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

    return {
        write: function(objects) {
            return new Promise(function(resolve, reject) {
                let transaction = db.transaction(dbTable, "readwrite");
                transaction.oncomplete = ()=> { //callback
                    console.log("transaction success");
                    resolve();
                }
                transaction.onerror = () => {
                    console.error("transaction error");
                    reject();
                }
                let objectStore = transaction.objectStore(dbTable);

                objects.forEach(object => {
                    objectStore.add(object);
                });
            });
        },
        read: function(keys) {
            var objects = [];

            return new Promise(function(resolve, reject) {
                let transaction = db.transaction(dbTable, "readonly");
                transaction.oncomplete = ()=> {
                    console.log("transaction success");
                    resolve(objects);
                }
                transaction.onerror = () => {
                    console.error("transaction error");
                    reject();
                }
                let objectStore = transaction.objectStore(dbTable);

                keys.forEach(key => {
                    var readRequest = objectStore.get(Number(key));
                    readRequest.onsuccess = function(event) {
                        if(event.target.result !== undefined) {
                            objects.push( event.target.result );
                        }
                    };
                });
            });
        },
        isExist: function() {
            return new Promise(function(resolve, reject) {
                let objectStore = db.transaction(dbTable, "readonly").objectStore(dbTable);
                objectStore.count().onsuccess = function(event) {
                    resolve(event.target.result !== 0);
                };
            });
        }
    }
    
})();