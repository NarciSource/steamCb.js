/**
 * steamCb - v0.4.1 - 2019-01-15
 * @requires jQuery v3.3.1+
 * @requires jQuery-ui v1.12.1+
 * @requires spin.js v2.3.2 (https://github.com/fgnass/spin.js)
 * @requires tablesorter v2.31.1 (https://mottie.github.io/tablesorter/docs/)
 * @requires fontawesome v4.7.0 (https://fontawesome.com/v4.7.0/)
 * 
 * https://github.com/NarciSource/steamCb.js
 * Copyright 2018-2019. Narci. all rights reserved.
 * Licensed under the MIT license
 */

 ;(function ($, window, document, undefined) {
    $.widget( "nar.steamCb", {
        version: "0.4.1",
        options: {
            width: "auto",
            height: "auto",
        },

        _create: function() {
            console.info("new steamCb");

            this.head = this.element.find(".cb-header");
            this.article = this.element.find(".cb-article");
            this.aside = this.element.find(".cb-aside");
            this.message = this.element.find(".cb-message");
            this.trashbox = this.element.find(".cb-trashbox");

            if(typeof this.options.table === "string")
                this.options.table = $(this.options.table);
            if(typeof this.options.record === "string")
                this.options.record = $(this.options.record);

            this._preheat();
            this._setEvent();
        },

        _init: function() {
            console.log("init");
        },

        _setEvent: function() {
            var that = this; //To keep the scope within the callback

            /*------- Search bar -------*/
            (async function ($search_bar, $search_icon, $searchCategory, $article) {
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
                
                var category = "app"; //default
                $searchCategory
                    .on("change", function() {
                        category = this.value;
                    });
                    
                $search_icon
                    .on("click", ()=>{ 
                        process();
                        clear();
                    });
                
                $search_bar
                    .attr("disabled","disabled")
                    /* Auto complete search */
                    .autocomplete({
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

            })(this.head.find("input.cb-searchBar"), this.head.find("i.cb-searchIcon"), this.head.find("select.cb-searchCategory"), this.article);
            

            /*------- Add a table -------*/
            this.element.find("i.cb-btnAddTable")
                    .on("click", function() { 
                        console.info("table");
                        that.addTable(); });


            /*------- Select a theme -------*/
            this.element.find(".cb-selStyle > select")
                    .on("click", function() {
                        that.options.theme = "."+this.value;
                        localStorage["theme"] = this.value; 
                        console.info("Change the theme")});


            /*------- Hides/show the article -------*/
            (function ($btnShow, $article) {
                if($btnShow.length === 0) return;
                if( localStorage["side-show"] === "hide" ) {
                    $btnShow.addClass("fa-minus-circle");
                    $btnShow.removeClass("fa-plus-circle");
                    $article.css("display", "none");
                } else {
                    $btnShow.addClass("fa-plus-circle");
                    $btnShow.removeClass("fa-minus-circle");
                    $article.css("display", "block");
                }

                $btnShow.on("click", function() {
                            $(this).toggleClass("fa-plus-circle");
                            $(this).toggleClass("fa-minus-circle");
                            if($(this).hasClass("fa-plus-circle")) {
                                $article.css("display", "block");
                                localStorage["side-show"] = "show";
                            } else {
                                $article.css("display", "none");
                                localStorage["side-show"] = "hide";
                            }
                        })
            })(this.element.find("i.cb-btnShow"), this.article);


            /*------- Erase -------*/
            this.element.find("i.cb-btnDelete")
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
            this.element.find("i.cb-btnCopyToClip")
                    .on("click", function () {
                        ((el) => {
                            var body = document.body, range, sel;
                            if (document.createRange && window.getSelection) {
                                range = document.createRange();
                                sel = window.getSelection();
                                sel.removeAllRanges();
                                try {            
                                    range.selectNodeContents(el);
                                    sel.addRange(range);
                                } catch (e) {
                                    range.selectNode(el);
                                    sel.addRange(range);
                                }
                            } else if (body.createTextRange) {
                                range = body.createTextRange();
                                range.moveToElementText(el);
                                range.select();
                            }
                        })( that.article[0]);
                        console.info("Copy to clipboard");
                        document.execCommand("Copy");});


            /*------- Reset DB and stroage -------*/
            var real_click=false;
            this.element.find("i.cb-btnReset")
                    .on("click", function () {
                        if(!real_click) {
                            console.warn("! Warning !");
                            console.warn("This action clears the db and requests a list of all games from the Steam Server.");
                            console.warn("If you would like to update newly released game on Steam, please continue this action.");
                            console.warn("Press the button again, if you really want to proceed.");
                            console.warn("This process takes tens of seconds.");
                            real_click=true;
                        } else {
                            idxDB.clear();
                            sessionStorage.clear();
                            localStorage.clear();
                            that.head.find("input.cb-searchBar")
                                .attr("disabled","disabled");
                            console.warn("Reset! Please refresh on page.");
                            real_click=false;
                        }
                    });



  
            /*------- Connect the tables and apply the sortable -------*/
            this.element.find(".cb-connectedSortable")
                    .sortable({ cancel: ".cb-sortable-disabled",
                                connectWith: ".cb-connectedSortable" });
            

            /*------- Intercept Console -------*/
            (function ($message) {
                var console_capture = function() {
                            window.console.info = function(msg) {
                                $message.append(msg + "<br>"); };
                            window.console.warn = function(msg) {
                                $message.append(`<font color="red">` + msg + `</font>` + "<br>"); }; },
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
                            } });
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

        _preheat: async function() {
            /* GinfoBuilder preheat */
            let spinner = new Spinner(this._spinner_opts).spin();
            this.head.append( $(spinner.el).css("display","inline") );
            {
                await GinfoBuilder.preheat();
                console.info("preheat");

                this.head.find("input.cb-searchBar")
                        .removeAttr("disabled");
            }
            spinner.stop();
            
            /* Return previous memory */
            spinner.spin();
            {
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
            }
            spinner.stop();
            
            /* Load search list */
            spinner.spin();
            this.head.append( $(spinner.el).css("display","inline") );
            {
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
                console.info("Load search list.");
            }
            spinner.stop();
        },

        popUp: function(arg) {
            arg = arg || {width:720, height:850}; //default
            
            if(!this.element.hasClass("ui-dialog")) {
                this.element
                    .dialog({
                        title: "steamCb",
                        resizable: true,
                        autoOpen: false,
                        closeText: "",
                        show: { effect: "blind", duration: 2000 },
                        hide: { effect: "explode", duration: 2000 },
                        width: arg.width, height: arg.height,
                        open: function(event, ui) {
                            $(".ui-icon-closethick", $(this).parent())
                                .removeClass("ui-icon")
                                .addClass("fa").addClass("fa-times")
                                .addClass("ui-cb-close");
                        } })
                    .dialog("widget")
                    .draggable("option", "containment", "none");
            }

            this.element.dialog("open");
        },

        popDelete: function() {
            this.element.dialog("destroy");
        },

        addTable: function() {
            /* make */
            let $table = $("<table/>", {
                            class: "cb-table",
                            html: $("<thead/><tbody/>") }),
                $tr = $("<tr/>");

            $.each(this.options.field, (name, text)=> {
                $("<th/>", {
                    name: name,
                    text: text
                }).appendTo($tr);
            });
            $table.appendTo(this.article)
                  .children("thead").append($tr);

            
            /* sorter */
            $table.addClass("tablesorter")
                  .tablesorter({
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
                });
                    

            /* connectedSortable */
            $table.find("tbody")
                    .addClass("cb-connectedSortable")
                    .sortable({connectWith: ".cb-connectedSortable"});

            
            /* engrave style */
            $table.engraveStyle(this.options.style, this.options.theme);

                

            console.info("Table has been added");
        },


        addGames: async function(category, gids) {
            if(gids === undefined) {
                gids = category;
                category = "app";
            }

            let spinner = new Spinner(this._spinner_opts).spin();
            spinner.spin(); //new
            this.head.append( $(spinner.el).css("display","inline") );
            {
                /* make */
                let $tr = $("<tr/>");
                $.each(this.options.record, (name, text)=> {
                    $("<td/>", {
                        name: name,
                        text: text
                    }).appendTo($tr);
                });

                try {
                /* writing record */
                const glist = await GinfoBuilder.build(category, gids);
                var records = glist.map(ginfo => {
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
                    
                    return $record;
                });                
                    
                } catch(err) {
                    console.warn(err);
                }

                /* Add records to the last table. */
                let $table = this.article.find("table").last();
                records.forEach($record => $record.appendTo($table.children("tbody")));
                

                /* update tablesorter */
                $table.trigger("updateAll");
                $table.find("th").css({ "user-select": "text",
                                        "-moz-user-select": "text",
                                        "-webkit-user-select": "text",
                                        "-ms-user-select": "text"});
                

                /* engrave style */
                $table.find("td").engraveStyle(this.options.style, this.options.theme);
            }
            spinner.stop();
        },

        _spinner_opts: {
            lines: 8, // The number of lines to draw
            length: 5, // The length of each line
            width: 9, // The line thickness
            radius: 16, // The radius of the inner circle
            scale: 0.35, // Scales overall size of the spinner
            corners: 1, // Corner roundness (0..1)
            color: '#000000', // CSS color or array of colors
            fadeColor: 'transparent', // CSS color or array of colors
            speed: 1, // Rounds per second
            rotate: 0, // The rotation offset
            animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
            direction: 1, // 1: clockwise, -1: counterclockwise
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            className: 'spinner', // The CSS class to assign to the spinner
            top: '4px', // Top position relative to parent
            left: '1px', // Left position relative to parent
            shadow: '0 0 1px transparent', // Box-shadow for the lines
            position: 'relative' // Element positioning
        }
    });

    

    $.fn.engraveStyle = function(styleSheet, classFilter) {
        classFilter = classFilter || "";
        parentFilter = ".parent";
        
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

                Object.keys(cssRule.style)
                    .forEach(i=> {
                        var property = cssRule.style[i],
                            value = cssRule.style[property];
                         
                        selectors.forEach(selector=> 
                            this.find(selector).addBack(selector).css(property, value)
                        );
                    });
            });
        return this;
    }

 })( jQuery, window, document);