/**
 * steamCb - v0.2.1 - 2018-12-12
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
            let that = this; //To keep the scope within the callback
            /* Informs it is loading. */
            this.spinner.spin();
            this.$head.append(this.spinner.el);
            
            /* Preheat GinfoBuilder */ 
            GinfoBuilder
                    .preheat() //async
                    .then(() => {
                        console.log("preheat");
                        that.$head.find("input.cb-header-searchBar")
                                .removeAttr("disabled");
                        
                        _loadPrevious.call(this);
                        that.spinner.stop(); })
                    .catch(e=> console.error(e));

  
            /* Connect the tables and apply the sortable */
            this.$document.find(".cb-connectedSortable")
                    .sortable({ cancel: ".cb-sortable-disabled",
                                connectWith: ".cb-connectedSortable" });

            /* Search bar */
            this.$head.find("input.cb-header-searchBar")
                    .on("keydown", function (key) {
                        if(key.keyCode == 13) {
                            let gids = $(this).val().split(',').map(gid => gid.trim());

                            if(!that.$article.children("table").length) { //no table
                                _addTable.call(that); }
                            _addGames.call(that, gids); }})
                    .attr("disabled","disabled");
            
            /* Add a table */
            this.$head.find("button.cb-header-addTable")
                    .on("click", function() { 
                        _addTable.call(that); });

            /* Select a theme */
            this.$head.find("select")
                    .on("click", function() {
                        that.theme = themeCollection({style: this.value});
                        localStorage.setItem("theme", this.value); });

            /* Erase */
            this.$head.find("button.cb-delete-button")
                    .on("click", function() { 
                        that.$article.not("tr.cb-sortable-disabled").remove();
                        sessionStorage.setItem("command", []); });    
            
            /* Erase the trashbox */
            this.$trashbox.find("tbody.cb-connectedSortable")
                    .on("mouseenter", function() { 
                        $(this) .css("cssText", "background: rgba(0, 102, 204, 0.5);")
                                .prev().text("비우기"); })
                    .on("mouseleave", function() {     
                        $(this) .css("cssText", "background: transparent")
                                .prev().text("휴지통"); })
            this.$trashbox.find("tr.cb-sortable-disabled")
                    .on("click", function() { 
                        $(this) .siblings().not("tr.cb-sortable-disabled")
                                .remove();});

            /* Copy to clipboard */
            this.$aside.find("button.cb-aside-copyToClip")
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
                        console.log("Copy");
                        document.execCommand("Copy");});

            
            /* Intercept Console */
            var console_capture = function() {
                    window.console.log = function(msg) {
                        that.$message.append(msg + "<br>"); };
                    window.console.error = function(msg) {
                        that.$message.append(`<font color="red">` + msg + `</font>` + "<br>"); }; },
                console_release = function() {
                        let i = document.createElement('iframe');
                        i.style.display = 'none';
                        document.body.appendChild(i);
                        window.console = i.contentWindow.console;
                };
            if(this.$message.find("input:checkbox").is(":checked")) {
                console_capture.call(this);
            }
            this.$message.find("input:checkbox")
                    .on("change", function() {
                        if($(this).is(":checked")) {
                            console_capture.call(that);
                        } else {
                            console_release.call(that);
                        } });

            /* Record $article's contents in sessionStorage */
            var contents_recording = function() {
                    let command = [];
                    that.$article.find("table.cb-table").each((_, table) => {
                        command.push("table");
                        $(table).find("tbody tr").each((_, tr) =>
                            command.push($(tr).attr("name")) );
                    });
                    sessionStorage.setItem("command", JSON.stringify(command));
                };
            this.$article.on("DOMNodeInserted", contents_recording);
            this.$trashbox.on("DOMNodeInserted", contents_recording);
        },
        _loadPrevious = function() {
            if(sessionStorage.getItem("command")) {
                let command = JSON.parse(sessionStorage.getItem("command"));
                command.forEach(element => {
                    switch(element) {
                        case "table": _addTable.call(this);
                        break;
                        default: _addGames.call(this, [element.split("-")[1]]);
                        break;
                    }
                });
            }
        },
        _popUp = function(arg) {
            arg = arg || {width:550, height:750}; //default
            
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

            console.log("A table has been added");
        },
        _addGames = function(gids) {
            this.spinner.spin(); //new
            this.$head.append(this.spinner.el);

            GinfoBuilder //async
                .build(gids)
                .then(glist => {
                    glist.forEach(ginfo => {
                        let $record = this.theme.outline.record.clone(); //new
                        
                        $record.find("td").attr("style", this.theme.style.td)
                               .first().attr("style", this.theme.style.td+this.theme.style.tdf)
                               .nextAll().last().attr("style", this.theme.style.td+this.theme.style.tdl);
                        
                        /* game field */
                        $record.find(`td[name="game"]`).html( 
                            $("<a/>").attr("href", ginfo.url_store).text(ginfo.name + (ginfo.is_dlc===true? " (dlc)":"")));

                        /* ratings field */
                        $record.find(`td[name="ratings"]`).html((val => {
                            switch(val) {
                                case "?" : return "?";
                                default : return $("<span/>").text(ginfo.reviews_text +"("+ginfo.reviews_perc+"%)");
                            }})(ginfo.reviews_text));
                        
                        /* cards field */
                        $record.find(`td[name="cards"]`).html((val => {
                            switch(val) {
                                case "?" : return "?";
                                case false : return "-";
                                case true : return $("<a/>").attr("href", ginfo.url_cards).html("❤");
                            }})(ginfo.trading_cards));

                        /* achievements field */
                        $record.find(`td[name="archv"]`).html((val => {
                            switch(val) {
                                case "?" : return "?";
                                case false : return "-";
                                case true : return $("<a/>").attr("href", ginfo.url_archv).text("▨");
                            }})(ginfo.achievements));
                        
                        /* bundles field */
                        $record.find(`td[name="bdl"]`).html(
                            $("<a/>").attr("href", ginfo.url_bundles).text(ginfo.bundles));

                        /* lowest field */
                        $record.find(`td[name="lowest"]`).html(
                            $("<a/>").attr("href", ginfo.url_history)
                                     .text("$ "+ginfo.lowest_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')));
                        
                        /* retail field */
                        $record.find(`td[name="retail"]`).html(
                            $("<a/>").attr("href", ginfo.url_price_info)
                            .text("$ "+ginfo.retail_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')));


                        $record.attr("name","gid-"+ginfo.gid)
                               .appendTo(this.$article.find("tbody").last());
                    });
                })
                .catch(error => console.log(error))
                .then(()=> this.spinner.stop());
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
        top: '-12px', // Top position relative to parent
        left: '270px', // Left position relative to parent
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
            this.theme = themeCollection(arg); //new
            this.spinner = new Spinner(spinner_opts);
            _setLayout.call(this);
            _setEvent.call(this);
            this.el = this.$document;
            $("head").append(this.theme.style.header);
        },
        popUp : function(arg) { _popUp.call(this, arg); },
        popDelete : function() { _popDelete.call(this); },
        addTable : function() { _addTable.call(this); },
        addGames : function(gids){ 
            if(!this.$article.children("table").length) //no table
               _addTable.call(this);
            GinfoBuilder
                .preheat()
                .then(()=> 
                    _addGames.call(this, gids)  );
        }
    };
}();



