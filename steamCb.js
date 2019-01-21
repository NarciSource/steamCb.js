/**
 * steamCb - v0.4.3 - 2019-01-22
 * @requires jQuery v3.3.1+
 * @requires jQuery-ui v1.12.1+
 * @requires tablesorter v2.31.1 (https://mottie.github.io/tablesorter/docs/)
 * @requires fontawesome v4.7.0 (https://fontawesome.com/v4.7.0/)
 * 
 * https://github.com/NarciSource/steamCb.js
 * Copyright 2018-2019. Narci. all rights reserved.
 * Licensed under the MIT license
 */

 ;(function ($, window, document, undefined) {
    $.widget( "nar.steamCb", {
        version: "0.4.2",
        options: {
            idTag: "defaultCb",
            theme: ".default",
            width: "auto",
            height: "auto",
        },

        _create: function() {
            console.info("new steamCb");

            /* shortcut */
            this.head = this.element.find(".cb-header");
            this.article = this.element.find(".cb-article");
            this.aside = this.element.find(".cb-aside");
            this.message = this.element.find(".cb-message");
            this.trashbox = this.element.find(".cb-trashbox");
            this.setting = this.element.find(".cb-setting");
          
            /* table focus */
            this.focused_table = $(/*null*/);
            

            /* Set the working zone of the pregressbar. */
            this._____search_progressbar_zone_____ = new Zone({
                    start: ()=> this.element.find(".cb-search__progressbar").css("visibility","visible"),
                    end: ()=> this.element.find(".cb-search__progressbar").css("visibility","hidden"),
                    monitor: true }).simply();

            this._____setting_progressbar_zone_____ = new Zone({
                    start: ()=> this.setting.find(".cb-setting__progressbar").css("visibility","visible"),
                    end: ()=> this.setting.find(".cb-setting__progressbar").css("visibility","hidden"),
                    }).simply();


            /* priority: localStorage(user) > create option(code) */
            this._downloadLocalStorage();
            this._updateLocalStorage();


            /* visable main / hide setting */
            this.element.children(".cb-setting").css("display","none")
                        .siblings().not(".cb-setting").css("display","flex");


            /* Set textarea in setting tab */
            this.setting.find(".cb-setting__option--styleSheet").val( this.options.style );
            this.setting.find(".cb-setting__option--field").val( JSON.stringify(this.options.field, null, 2) );
            this.setting.find(".cb-setting__option--record").val( JSON.stringify(this.options.record, null, 2) );



            this._setEvent();
            this._preheat();
        },

        _init: function() {
            console.log("init");
        },

        _setEvent: function() {
            var that = this; //To keep the scope within the callback

            /*------- Search bar -------*/
            (async function ($search, $search_bar, $search_icon, $searchCategory, $article) {
                let gids = { app: [], sub: [], bundle: [], all: [] },
                    process = function() {
                        if(gids.length === 0) {
                            /* search by gids */
                            gids = $search_bar.val().split(",").map(gid=>gid.trim()).filter(gid=> (/^[0-9]*$/).test(gid));
                        }

                        if(!$article.children("table").length) {//no table
                            that.addTable();
                        }
                        
                        Object.keys(gids).filter(category=>gids[category].length).forEach(category=> {
                            that.addGames(category, gids[category]);
                        });
                    },
                    clear = function() {
                        gids= { app: [], sub: [], bundle: [], all: [] };
                        $search_bar
                            .val("")
                            .data("uiAutocomplete").menu.element.hide();
                    };
                
                /* progress bar */
                $search.progressbar({
                    classes: {"ui-progressbar-value":"cb-search__progressbar"},
                    value: false
                }).css({"border":"0px"});

                /* search category */
                var category = "app"; //default
                $searchCategory
                    .on("change", function() {
                        category = this.value;
                    });
                    
                /* search icon */
                $search_icon
                    .on("click", ()=>{ 
                        process();
                        clear();
                    });
                
                /* search bar */
                $search_bar
                    .autocomplete({ /* Auto complete search */
                        source : function(request, response) {
                            if( category === "all") {
                                var searchList = Object.assign( that.searchList["app"], that.searchList["sub"], that.searchList["bundle"] );
                            } else {
                                var searchList = that.searchList[ category ];
                            }

                            response( $.ui.autocomplete.filter(
                                searchList, (request.term).split( /,\s*/ ).pop()
                            ));
                        },
                        search : function() {
                            let term = (this.value).split( /,\s*/ ).pop();
                            if(term.length < 5) { // Search from 5 letters or more.
                                return false;
                            }
                        },
                        select : function(event, ui) {
                            let terms = (this.value).split( /,\s*/ );
                            terms.pop(), terms.push( ui.item.label ), terms.push("");
                            this.value = terms.join(", ");
 
                            gids[ category ].push( ui.item.gid );
                            return false;
                        }
                    })
                    .on("keydown", function (key) {
                        if(key.keyCode == 13) { //enter-key
                            process();
                            clear();
                        }
                    })
                    .data("uiAutocomplete").close = function(e) {
                        return false;
                    };

            })(this.head.find(".cb-search"), this.head.find(".cb-search__bar"), this.head.find(".cb-search__icon"), this.head.find(".cb-search__category"), this.article);
            
                    
            /*------- Table focus release -------*/
            this.article
                    .attr("tabindex",0)
                    .focus(function() {
                        that.focused_table.toggleClass("cb-tablehighlight");
                        that.focused_table = $(/*null*/);//release
                    });

            /*------- Add a table -------*/
            this.element.find("i.cb-btn--add-table")
                    .on("click", function() { 
                        that.addTable(); });


            /*------- Parses classes from the stylesSheet. -------*/
            let classes = (function(styleSheet) {
                let doc = document.implementation.createHTMLDocument(""),
                    styleElement = document.createElement("style");

                styleElement.textContent = styleSheet;
                doc.body.appendChild(styleElement);

                let cssRules = styleElement.sheet.cssRules,  classes = new Set();

                Object.keys(cssRules).forEach(i=> classes.add( /^.\w+/.exec(cssRules[i].selectorText)[0] ) );
                
                return classes;
            })(this.options.style);
            
            classes.forEach(classname=> {
                this.element.find(".cb-sel-style__select")
                    .append(new Option(classname.substring(1).toUpperCase(), classname));
            });

            this.element.find(".cb-sel-style__select").val( this.options.theme );


            /*------- Select a theme -------*/
            this.element.find(".cb-sel-style__select")
                    .on("click", function() {
                        that.options.theme = this.value;
                        that._updateLocalStorage(); })
                    .on("change", function() {
                        console.info("The table theme changed to "+this.value)});


            /*------- Hides/show the article -------*/
            (function ($btnShow, $article) {
                if( $btnShow.length === 0 ) return;
                if( localStorage["side-show"] === "hide" ) {
                    $btnShow.switchClass("fa-plus-circle", "fa-minus-circle");
                    $article.css("display", "none");
                } else {
                    $btnShow.switchClass("fa-minus-circle", "fa-plus-circle");
                    $article.css("display", "flex");
                }

                $btnShow.on("click", function() {
                    $(this).toggleClass("fa-plus-circle fa-minus-circle");
                    if($(this).hasClass("fa-plus-circle")) {
                        $article.css("display", "flex");
                        localStorage["side-show"] = "show";
                    } else {
                        $article.css("display", "none");
                        localStorage["side-show"] = "hide";
                    }
                })
            })(this.element.find(".cb-btn--show"), this.article);


            /*------- Erase -------*/
            this.element.find(".cb-btn--delete")
                    .on("click", function() { 
                        that.article.children().not("tr.cb-sortable-disabled").remove();
                        sessionStorage["command"] = [];
                        console.info("Erase"); });    
            
            /*------- Erase the trashbox -------*/
            this.trashbox.find("tr.cb-sortable-disabled")
                    .on("click", function() { 
                        $(this) .siblings().not("tr.cb-sortable-disabled")
                                .remove();
                        console.info("Erase"); });


            /*------- Copy to clipboard -------*/
            this.element.find(".cb-btn--copy-to-clip")
                    .on("click", function () {
                        ((elements) => {
                            var body = document.body, range, sel;
                            if (document.createRange && window.getSelection) {
                                sel = window.getSelection();
                                sel.removeAllRanges();
                                elements.each((_, el)=> {
                                    range = document.createRange();
                                    try {
                                        range.selectNodeContents(el);
                                        sel.addRange(range);
                                    } catch (e) {
                                        range.selectNode(el);
                                        sel.addRange(range);
                                    }
                                });
                            } else if (body.createTextRange) {
                                range = body.createTextRange();
                                range.moveToElementText(el);
                                range.select();
                            }
                        })( that.article.children());
                        console.info("Copy to clipboard");
                        document.execCommand("Copy");});


        


            /*------- Setting tab -------*/
            this.element.find(".cb-btn--setting-in")
                    .on("click", ()=> {
                        this.element.children(".cb-setting").css("display","flex")
                                    .siblings().not(".cb-setting").css("display","none");
                    });
            this.element.find(".cb-btn--setting-out")
                    .on("click", ()=> {
                        this.element.children().not(".cb-setting").css("display","flex")
                                    .siblings(".cb-setting").css("display","none");
                    });
            this.element.find(".cb-btn--save")
                    .on("click", ()=> {
                        this._____setting_progressbar_zone_____(()=> {
                            this.options.style = this.element.find(".cb-setting__option--styleSheet").val();
                            this.options.field = JSON.parse( this.element.find(".cb-setting__option--field").val() );
                            this.options.record = JSON.parse( this.element.find(".cb-setting__option--record").val() );
                            
                            this._updateLocalStorage();    
                        }, {
                            mintime:1000*1
                        }).then(()=>console.log("Saved setting"));
                    });
            this.element.find(".cb-setting__progressbar")
                    .progressbar({value: false});

                    
            /*------- Reset DB and stroage -------*/
            this.element.find(".cb-btn--reset")
                    .on("click", function () {
                        $("<div/>").dialog({
                            title: "Warning",
                            width: 400,
                            closeText: "",
                            show: { effect: "bounce", duration: 2000 },
                            hide: { effect: "clip", duration: 200 },
                            classes: {
                                "ui-dialog":"cb-dialog",
                                "ui-dialog-title":"cb-dialog-title--alert",
                                "ui-dialog-titlebar":"ui-dialog-titlebar cb-dialog-titlebar cb-dialog-titlebar--alert",
                                "ui-dialog-titlebar-close":"cb-dialog-titlebar-close",
                                "ui-dialog-content":"cb-dialog-content--alert",
                                "ui-dialog-buttonpane":"cb-dialog-buttonpane--alert",
                                "ui-dialog-buttonset":"cb-dialog-buttonset--alert"
                            },
                            open: function() { 
                                $(this).parent().find(".ui-icon-closethick").switchClass("ui-icon ui-icon-closethick","cb-icon-closethick fa fa-times",0);
   
                                $(this).append($("<p>", {text: "This action clears the db and requests a list of all games from the Steam Server." }))
                                        .append($("<p>", {text: "If you would like to update newly released game on Steam, please continue this action."}))
                                        .append($("<p>", {text: "This process takes a few minutes after this page refresh."}))
                            },                                                
                            buttons: {
                                Okay: {
                                    click: function() {
                                        idxDB.clear();
                                        sessionStorage.clear();
                                        localStorage.clear();
                                        location.reload();
                                    },
                                    text: "Okay",
                                    class: "cb-dialog-button--alert"
                                }
                            }
                        }).dialog("open");
                    });



  
            /*------- Connect the tables and apply the sortable -------*/
            this.element.find(".cb-connectedSortable")
                    .sortable({ cancel: ".cb-sortable-disabled",
                                connectWith: ".cb-connectedSortable" });
            

            /*------- Intercept Console -------*/
            (function ($message) {
                let console_capture = function() {
                            window.console.info = function() {
                                for (let i=0; i<arguments.length; i++) {
                                    $message.append(arguments[i]+" ");
                                }
                                $message.append("<br>");
                            };
                            window.console.warn = function() {
                                $message.append(`<font color="red">`);
                                for (let i=0; i<arguments.length; i++) {
                                    $message.append(arguments[i]+" ");
                                }
                                $message.append(`</font><br>`);
                            };
                    },
                    console_release = function() {
                            let i = document.createElement('iframe');
                            i.style.display = 'none';
                            document.body.appendChild(i);
                            window.console = i.contentWindow.console;
                    };
                if($message.find("input:checkbox").is(":checked")) {
                    console_capture.call(that);
                }
                $message.find("input:checkbox")
                        .on("change", function() {
                            if($(this).is(":checked")) {
                                console_capture.call(that);
                            } else {
                                console_release.call(that);
                            }
                });
                $message.on("DOMNodeInserted", function() {
                            $(this).scrollTop($(this).prop("scrollHeight"));
                });
            })(this.message);



            /*------- Record $article's contents in sessionStorage -------*/
            (function ($article, $trashbox) {
                var contents_recording = function() {
                        let command = [];
                        $article.find("table.cb-table").each((_, table) => {
                            command.push("table");
                            $(table).find("tbody tr").each((_, tr) =>
                                command.push($(tr).attr("name")) );
                        });
                        sessionStorage["command"] = JSON.stringify(command);
                    };
                $article.on("DOMNodeInserted", contents_recording);
                $trashbox.on("DOMNodeInserted", contents_recording);

            })(this.article, this.trashbox);
        },

        _preheat: function() {
            this._____search_progressbar_zone_____(async ()=> {
                /* GinfoBuilder preheat */
                console.info("preheat: Loading DB.");
                await GinfoBuilder.preheat();


                /* Return previous memory */
                console.info("preheat: Loading previous table.");
                if(sessionStorage["command"]) {
                    const command = JSON.parse(sessionStorage["command"]);

                    for( let i=0; i<command.length; i++) {
                        switch(command[i]) {
                            case "table": this.addTable();
                            break;
                            default: await this.addGames([command[i].split("-")[1]]);
                            break;
                        }
                    }
                }

                
                /* Load search list */
                console.info("preheat: Loading Search list.")
                this.searchList = localStorage["searchList"];
                if(!this.searchList) {
                    const dataType = function(value) {
                        return {label: value.name, gid: value.gid};
                    };
                    
                    this.searchList = { app: await idxDB.readAll("app",dataType),
                                        sub: await idxDB.readAll("sub",dataType),
                                        bundle: await idxDB.readAll("bundle",dataType) };
                    localStorage["searchList"] = JSON.stringify(this.searchList);

                } else {
                    this.searchList = JSON.parse(this.searchList);
                }
                
            })
            .then(()=>console.info("preheat completed."))
            .catch(e=>console.warn(e));
        },
        
        _downloadLocalStorage: function() {
            if( localStorage[ this.options.idTag ] )
                this.options = JSON.parse( localStorage[ this.options.idTag ] );
        },

        _updateLocalStorage: function() {
            localStorage[ this.options.idTag ] = JSON.stringify( this.options );
        },


        popUp: function(arg) {
            let that = this;
            arg = arg || {width: this.options.width || 720, height: this.options.height || 850}; //default
            
            this.element
                .dialog({
                    title: "steamCb",
                    resizable: true,
                    autoOpen: true,
                    closeText: "",
                    show: { effect: "scale", duration: 1000 },
                    hide: { effect: "clip", duration: 500 },
                    width: arg.width, height: arg.height,
                    classes: {
                        "ui-dialog":"cb-dialog",
                        "ui-dialog-titlebar":"ui-dialog-titlebar cb-dialog-titlebar",
                        "ui-dialog-title":"cb-dialog-title",
                        "ui-dialog-titlebar-close":"cb-dialog-titlebar-close"
                    },
                    open: function(event, ui) {
                        $(this).parent().find(".ui-icon-closethick").switchClass("ui-icon ui-icon-closethick","cb-icon-closethick fa fa-times",0);
                    },
                    resizeStop: function() {
                        that.options.width = $(this).width();
                        that.options.height = $(this).height();
                        that._updateLocalStorage();
                    }
                });
        },

        popDelete: function() {
            this.element.dialog("destroy");
        },

        addTable: function() {
            let that = this;

            $("<table/>", {
                class: "cb-table tablesorter",
                attr: { tabindex:0 },
                html: $.merge(
                    $("<thead/>", {
                        html: $("<tr/>", {
                                html: $.map( that.options.field, (text, name)=> 
                                        $("<th/>", {
                                            name: name,
                                            text: text
                                        })
                                    )
                            })
                    }),
                    $("<tbody/>", { /* connect sortable */
                        class: "cb-connectedSortable",
                        sortable: { connectWith: ".cb-connectedSortable" }
                    })
                ),
                on: {
                    mouseup: function() {
                        $(this) .trigger("updateAll")
                                .focus();
                    },
                    focusin: function() { /* focus selected table */
                        that.focused_table.toggleClass("cb-tablehighlight");
                        that.focused_table = $(this);
                        that.focused_table.toggleClass("cb-tablehighlight");
                    }
                },
                engraveStyle: { /* engrave style */
                    styleSheet: that.options.style, 
                    classFilter: that.options.theme
                },
                tablesorter: { /* sorter */
                    textExtraction : function(node) {
                        if($(node).find("span").text() === "?") return -1;
                        return $(node).find("span").text().replace("%","");
                    },
                    textSorter : {
                        1 : function(a, b) {
                            const refa = Number(a.match(/\d+/g).join("")),
                                    refb = Number(b.match(/\d+/g).join(""));
                            return (refa < refb)? -1 : ((refa > refb)? 1 : 0);
                        }
                    }
                }
            }).focusin().appendTo(this.article);

            console.info("Table has been added");
        },


        addGames: async function(category, gids) {
            await this._____search_progressbar_zone_____(async()=> {

                if(gids === undefined) {
                    gids = category;
                    category = "app";
                }

                /* make */
                const $tr = $("<tr/>", {
                        html: $.map( this.options.record, (text, name)=> 
                                $("<td/>", {
                                    name: name,
                                    text: text
                                }
                        ))
                    }),
                    glist = await GinfoBuilder.build(category, gids);

                /* writing record */
                let records = $.map( glist, ginfo => {
                    let $record = $tr.clone();

                    /* record identification */
                    $record.attr("name","gid-"+ginfo.gid);

                    
                    /* game field */
                    $record.find(`td[name="game"]`).html( 
                        $("<a/>", {
                            href: ginfo.url_store,
                            html: $("<span/>", { 
                                text: ginfo.name + (ginfo.is_dlc===true? " (dlc)":"")})
                        }) );

                    /* ratings field */
                    $record.find(`td[name="ratings"]`).html((val => {
                        switch(val) {
                            case "?" : return $("<span/>", { text: "?"});
                            default : return $("<span/>", { 
                                                    text: ginfo.reviews_text+" ("+String(ginfo.reviews_perc)+"%)" });
                        }})(ginfo.reviews_text) );
                    
                    /* cards field */
                    $record.find(`td[name="cards"]`).html((val => {
                        switch(val) {
                            case "?" : return $("<span/>", { text: "?"});
                            case false : return $("<span/>", { text: "-"});
                            case true : return $("<a/>", {
                                                    href: ginfo.url_cards,
                                                    html: $("<span/>", { text: "❤"}) });
                        }})(ginfo.trading_cards) );

                    /* achievements field */
                    $record.find(`td[name="archvment"]`).html((val => {
                        switch(val) {
                            case "?" : return $("<span/>", { text: "?"});
                            case false : return $("<span/>", { text: "-"});
                            case true : return $("<a/>", {
                                                    href: ginfo.url_archv,
                                                    html: $("<span/>", { text: "▨"}) });
                        }})(ginfo.achievements));
                    
                    /* bundles field */
                    $record.find(`td[name="bundles"]`).html(
                        $("<a/>", {
                            href: ginfo.url_bundles,
                            html: $("<span/>",{ text: ginfo.bundles})
                        }));

                    /* lowest field */
                    $record.find(`td[name="lowest"]`).html((val => {
                        switch(val) {
                            case "?" : return $("<span/>", { text: "?"});
                            default : return $("<a/>", {
                                                href: ginfo.url_history,
                                                html: $("<span/>", {
                                                        text: "$"+ginfo.lowest_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}) });
                        }})(ginfo.lowest_price));                            
                    
                    /* retail field */
                    $record.find(`td[name="retail"]`).html((val => {
                        switch(val) {
                            case "?" : return $("<span/>", { text: "?"});
                            default : return  $("<a/>", {
                                                href: ginfo.url_price_info,
                                                html: $("<span/>", {
                                                        text: "$"+ginfo.retail_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}) });
                        }})(ginfo.retail_price));
                    
                    return $record[0];
                });

                /* engrave style */
                $(records).find("td")
                        .engraveStyle({
                            styleSheet: this.options.style, 
                            classFilter: this.options.theme
                        });
                

                /* update tablesorter */
                this.focused_table.trigger("updateAll")
                    .find("th")
                        .css({  "user-select": "text",
                                "-moz-user-select": "text",
                                "-webkit-user-select": "text",
                                "-ms-user-select": "text"});


                /* Add records to the focused table. */
                if (this.focused_table.length === 0) this.addTable();
                this.focused_table.children("tbody").html(records);
            })
            .then(()=>console.info("Added games"))
            .catch(()=>console.warn("error"));
        }
    });

    
    /**
     * The engraveStyle plugin parses the stylesheet and engraves the selected class into the object.
     * */
    $.fn.engraveStyle = function({styleSheet, classFilter}) {
        classFilter = classFilter || "";
        parentFilter = ".default";
        
        var doc = document.implementation.createHTMLDocument(""),
            styleElement = document.createElement("style");

        styleElement.textContent = styleSheet;
        doc.body.appendChild(styleElement);

        var cssRules = styleElement.sheet.cssRules;
        Object.keys(cssRules)
            .filter(i=> cssRules[i].selectorText.includes(classFilter) || cssRules[i].selectorText.includes(parentFilter) )
            .forEach(i=> {
                var cssRule = cssRules[i],
                    selectors = cssRule.selectorText
                                    .split( /,\s*/ )
                                    .filter(selector=> selector.includes(classFilter) || selector.includes(parentFilter) )
                                    .map(selector=> selector.replace(classFilter,"").replace(parentFilter,"").trim());

                for(let i=0;i<cssRule.style.length;i++) {
                    var property = cssRule.style[i],
                        value = cssRule.style[property];
                         
                        selectors.forEach(selector=> {
                            this.find(selector).addBack(selector).css(property, value)}
                        );
                }
            });
        return this;
    }

 })( jQuery, window, document);



/** 
 * The Zone class appends and manages operations at both ends of the zone.
 * When activating the monitor, start and end of every element in the zone of this object are concatenated. 
 * */
function Zone({start, end, monitor}) {
    this.start = start;
    this.end = end;
    this.monitor = monitor || false;
    this.semaphore = 0;
};
Zone.prototype.proc = function(callback, option) {
    const that = this,
          defaults = {
                mintime: 0,
                maxtime: 1000*60*5 //5minutes
          };

    option = Object.assign({}, defaults, option);
    
    if(!(this.start && {}.toString.call(this.start) === '[object Function]'))
        this.start = this.start || function() { return undefined };
    if(!(this.end && {}.toString.call(this.end) === '[object Function]'))
        this.end = this.end || function() { return undefined };
    
    return new Promise(async (resolve, reject)=> {
        try{
            if(!that.monitor || that.semaphore === 0) // P
                that.start();
            that.semaphore = that.semaphore+1;

            let wait = ms=> new Promise(resolve => setTimeout(resolve, ms));
                callback = new Promise(async resolve => { 
                    await callback(); 
                    resolve();
                });
        
            await Promise.race([ wait(option.maxtime),
                        Promise.all([ callback, wait(option.mintime) ]) ]);
            resolve();
        }
        catch(e) {
            reject();
        }
        finally {
            that.semaphore = that.semaphore-1;
            if(!that.monitor || that.semaphore === 0) // V
                that.end();
        }
    });
};                
Zone.prototype.simply = function() {
    return this.proc.bind(this);
}