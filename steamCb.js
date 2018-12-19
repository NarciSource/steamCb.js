/**
 * steamCb - v0.3.4 - 2018-12-20
 * https://github.com/NarciSource/steamCb.js
 * Copyright 2018. Narci. all rights reserved.
 * Licensed under the MIT license
 */




/**
 * @class       SteamCb
 * @classdesc   
 */
function SteamCb(arg) {
    console.log("New SteamCb");
    this.init(arg || {outline: "popup", style: "eevee"}); //default
};

SteamCb.prototype = function() {
    var _setLayout = function() {
            this.$document = this.theme.outline.window.clone(); //new
            
            this.$head = this.$document.find("#cb-header");
            this.$article = this.$document.find("#cb-article");
            this.$aside = this.$document.find("#cb-aside");
            this.$message = this.$document.find("#cb-message");
            this.$trashbox = this.$document.find("#cb-trashbox");
        },
        _setEvent = function() {
            var that = this; //To keep the scope within the callback

            /* Search bar */
            (async function ($search_bar, $search_icon, $article) {
                let gids = [],
                    process = function() {
                        if(gids.length === 0) {
                            /* search by gids */
                            gids = $search_bar.val().split(",").map(gid=>gid.trim()).filter(gid=> (/^[0-9]*$/).test(gid));
                        }

                        if(!$article.children("table").length) {//no table
                            _addTable.call(that);
                        }
                        _addGames.call(that, gids.slice()); 
                        gids = [/*empty*/];
                        $search_bar.val("");
                    };
                $search_icon
                    .on("click", process);

                $search_bar
                    .attr("disabled","disabled")
                    .autocomplete({
                        /* Auto complete search */
                        source : function(request, response) {
                            response( $.ui.autocomplete.filter(
                                that.searchList, (request.term).split( /,\s*/ ).pop()
                            ));
                        },
                        search : function() {
                            // Search from 5 letters or more.
                            let term = (this.value).split( /,\s*/ ).pop();
                            if(term.length < 5) {
                                return false;
                            }
                        },
                        select : function(_, ui) {
                            let terms = (this.value).split( /,\s*/ );
                            terms.pop();
                            terms.push( ui.item.label );
                            gids.push( ui.item.gid );
                            terms.push("");
                            this.value = terms.join(", ");
                            return false;
                        }  
                    })
                    .on("keydown", function (key) {
                        if(key.keyCode == 13) { //enter-key
                            process();
                        }
                    });
            })(this.$head.find("input.cb-searchBar"), this.$head.find("i.cb-searchIcon"), this.$article);
            

            
            /* Add a table */
            this.$document.find("i.cb-btnAddTable")
                    .on("click", function() { 
                        _addTable.call(that); });

            /* Select a theme */
            this.$document.find("select.selStyle")
                    .on("click", function() {
                        that.theme = cbLayout({outline: that.arg.outline, style: this.value});
                        localStorage["theme"] = this.value; 
                        console.log("Change the theme")});

            /* Hides/show the article */
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
            })(this.$document.find("i.cb-btnShow"), this.$article);


            /* Erase */
            this.$document.find("i.cb-btnDelete")
                    .on("click", function() { 
                        that.$article.children().not("tr.cb-sortable-disabled").remove();
                        sessionStorage["command"] = []; });    
            
            /* Erase the trashbox */
            this.$trashbox.find("tr.cb-sortable-disabled")
                    .on("click", function() { 
                        $(this) .siblings().not("tr.cb-sortable-disabled")
                                .remove();
                        console.log("Erase"); });

            /* Copy to clipboard */
            this.$document.find("i.cb-btnCopyToClip")
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
                        })( that.$article[0]);
                        console.log("Copy to clipboard");
                        document.execCommand("Copy");});

            /* Reset DB and stroage */
            this.$document.find("i.cb-btnReset")
                    .on("click", function () {
                        idxDB.clear();
                        sessionStorage.clear();
                        localStorage.clear();
                        that.$head.find("input.cb-header-searchBar")
                            .attr("disabled","disabled");
                        console.error("Reset!") });



  
            /* Connect the tables and apply the sortable */
            this.$document.find(".cb-connectedSortable")
                    .sortable({ cancel: ".cb-sortable-disabled",
                                connectWith: ".cb-connectedSortable" });
            

            /* Intercept Console */
            (function ($message) {
                var console_capture = function() {
                            window.console.log = function(msg) {
                                $message.append(msg + "<br>"); };
                            window.console.error = function(msg) {
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
            })(this.$message);



            /* Record $article's contents in sessionStorage */
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

            })(this.$article, this.$trashbox);
        },
        _preheat = async function() {
            /* GinfoBuilder preheat */
            let spinner = new Spinner(spinner_opts).spin();
            this.$head.append( $(spinner.el).css("display","inline") );
            {
                await GinfoBuilder.preheat();
                console.log("preheat");

                this.$head.find("input.cb-searchBar")
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
                            case "table": _addTable.call(this);
                            break;
                            default: await _addGames.call(this, [command[i].split("-")[1]]);
                            break;
                        }
                    }
                }
            }
            spinner.stop();
            
            /* Load search list */
            spinner.spin();
            this.$head.append( $(spinner.el).css("display","inline") );
            {
                this.searchList = localStorage["searchList"];
                if(!this.searchList) {
                    const dataType = function(value) {
                        return {label: value.name, gid: value.gid};
                    };
                    
                    this.searchList = await idxDB.readAll(dataType);
                    localStorage["searchList"] = JSON.stringify(this.searchList);

                } else {
                    this.searchList = JSON.parse(this.searchList);
                }
                console.log("Load search list.");
            }
            spinner.stop();
        },
        _popUp = function(arg) {
            arg = arg || {width:610, height:750}; //default
            
            if(!this.$document.hasClass("ui-dialog")) {
                this.$document
                    .dialog({
                        resizable: true,
                        autoOpen: false,
                        closeText: "",
                        show: { effect: "blind", duration: 2000 },
                        hide: { effect: "explode", duration: 2000 },
                        width: arg.width, height: arg.height })
                    .dialog("widget")
                    .draggable("option", "containment", "none");
            }

            this.$document.dialog("open");
        },
        _popDelete = function() {
            this.$document.dialog("destroy");
        },
        _addTable = function() {
            const $table = this.theme.outline.table.clone(); //new
            
            $table  .attr("style", this.theme.style.table)
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
                    })
                    .appendTo(this.$article);

            $table.find("thead")
                    .attr("style", this.theme.style.thead)
                    .find("th")
                    .attr("style", this.theme.style.th)
                    .first()
                    .attr("style", this.theme.style.th+this.theme.style.thf)
                    .nextAll().last()
                    .attr("style", this.theme.style.th+this.theme.style.thl);
                    
            $table.find("tbody")
                    .addClass("cb-connectedSortable")
                    .sortable({connectWith: ".cb-connectedSortable"})
                    .attr("style", this.theme.style.tbody);

            console.log("Table has been added");
        },
        _addGames = async function(gids) {
            let spinner = new Spinner(spinner_opts).spin();
            spinner.spin(); //new
            this.$head.append( $(spinner.el).css("display","inline") );

            const glist = await GinfoBuilder.build(gids);
            try {
                glist.forEach(ginfo => {
                    let $record = this.theme.outline.record.clone(); //new
                    
                    /* game field */
                    $record.find(`td[name="game"]`).html( 
                        $("<a/>", {
                            href: ginfo.url_store,
                            html: $("<span/>", { 
                                text: ginfo.name + (ginfo.is_dlc===true? " (dlc)":"")  })
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
                    $record.find(`td[name="archv"]`).html((val => {
                        switch(val) {
                            case "?" : return $("<span/>", { text: "?"});
                            case false : return $("<span/>", { text: "-"});
                            case true : return $("<a/>", {
                                                    href: ginfo.url_archv,
                                                    html: $("<span/>", { text: "▨"}) });
                        }})(ginfo.achievements));
                    
                    /* bundles field */
                    $record.find(`td[name="bdl"]`).html(
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
                                                        text: "$ "+ginfo.lowest_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') }) });
                        }})(ginfo.lowest_price));                            
                    
                    /* retail field */
                    $record.find(`td[name="retail"]`).html((val => {
                        switch(val) {
                            case "?" : return $("<span/>", { text: "?"});
                            default : return  $("<a/>", {
                                                href: ginfo.url_price_info,
                                                html: $("<span/>", {
                                                        text: "$ "+ginfo.retail_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') }) });
                        }})(ginfo.retail_price));
                    

                    /* record style */
                    $record.find("td").attr("style", this.theme.style.td)
                           .first().attr("style", this.theme.style.td+this.theme.style.tdf)
                           .nextAll().last().attr("style", this.theme.style.td+this.theme.style.tdl)
                           .prev().attr("style", this.theme.style.td+this.theme.style.tdl)
                           .parent().find("a > span").attr("style", this.theme.style.a);

                    /* Add records to the last table. */
                    const $table = this.$article.find("table").last();
                    $record.attr("name","gid-"+ginfo.gid)
                           .appendTo($table.children("tbody"));

                    /* update tablesorter */
                    $table.trigger("updateAll");
                    $table.find("th").css("-moz-user-select","text");
                });
            } catch(err) {
                console.error(err);
            }
            spinner.stop();
        };

    const spinner_opts = {
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
        };

    return {
        //public
        /**@method init
         * @param  {Object} arg
         * @param  {string} arg.outline
         * @param  {string} arg.style */
        init : function(arg) {
            this.arg = arg;
            this.theme = cbLayout(arg); //new

            _setLayout.call(this);
            _preheat.call(this);
            _setEvent.call(this);
            
            this.el = this.$document;
        },
        popUp : function(arg) { _popUp.call(this, arg); },
        popDelete : function() { _popDelete.call(this); },
        addTable : function() { _addTable.call(this); },
        addGames : function(gids){ 
            if(!this.$article.children("table").length) //no table
               _addTable.call(this);
               
            _addGames.call(this, gids);
        }
    };
}();