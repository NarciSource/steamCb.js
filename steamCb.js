/**
 * steamCb - v0.2.0 - 2018-12-10
 * https://github.com/NarciSource/steamCb.js
 * Copyright 2018. Narci. all rights reserved.
 * Licensed under the MIT license
 */



$.fn.htmlTo = function(elem) { this.each(function() { $(elem).html($(this)); }); }

/**
 * @class       SteamCb
 * @classdesc   
 */
function SteamCb() {
    this.init();
    console.log("New SteamCb");
};
SteamCb.prototype = function() {
    var _setLayout = function() {
            this.$document = $(this.theme.outline.base); //new

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
                        that.spinner.stop(); })
                    .catch(()=> {/*error code*/});

  
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
            this.$head.find("button.cb-header-_addTable")
                    .on("click", function() { 
                        _addTable.call(that); });

            /* Select a theme */
            this.$head.find("select")
                    .on("click", function() {
                        that.theme = themeCollection(this.value); });

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
            const $table = $(this.theme.outline.table).clone(); //new
            
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
                        let $record = $(this.theme.outline.record).clone(); //new

                        let $data = $record.find("td");
                        
                        $("<a/>").attr("href", ginfo.url_store)
                                    .text(ginfo.name + 
                                        (ginfo.is_dlc===true? " (dlc)":""))
                                    .htmlTo($data.eq(0));

                        
                        if(ginfo.trading_cards === "?") {
                            $data.eq(1).text("?");
                        } else if(ginfo.trading_cards) {
                            $("<a/>").attr("href", ginfo.url_cards)
                                        .text("❤")
                                        .htmlTo($data.eq(1));
                        } else {
                            $data.eq(1).text("-");
                        }

                        if(ginfo.achievements === "?") {
                            $data.eq(2).text("?");
                        } else if(ginfo.achievements) {
                            $("<a/>").attr("href", ginfo.url_archv)
                                        .text("▨")
                                        .htmlTo($data.eq(2));
                        } else {
                            $data.eq(2).text("-");
                        }
                                    
                        $("<a/>").attr("href", ginfo.url_bundles)
                                    .text(ginfo.bundles)
                                    .htmlTo($data.eq(3));
                                    
                        $("<a/>").attr("href", ginfo.url_history)
                                    .text("$ "+ginfo.lowest_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'))
                                    .htmlTo($data.eq(4));
                                    
                        $("<a/>").attr("href", ginfo.url_price_info)
                                    .text("$ "+ginfo.retail_price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'))
                                    .htmlTo($data.eq(5));

                                    
                        $data.attr("style", this.theme.style.td)
                            .first().attr("style", this.theme.style.td+this.theme.style.tdf)
                            .nextAll().last().attr("style", this.theme.style.td+this.theme.style.tdl);

                        this.$article.find("tbody").last()
                                .append($record);
                    });
                    this.spinner.stop(); // 통합하자
                })
                .catch(error => {
                    console.log(error);
                    this.spinner.stop(); 
                });
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
        init : function() { 
            this.theme = themeCollection("eevee"); //new
            this.spinner = new Spinner(spinner_opts);
            _setLayout.call(this);
            this.el = this.$document;
            _setEvent.call(this);
            $("head").append($(this.theme.style.header));
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



/**
 * @method      themeCollection
 * @description This function has the html and css needed to outline and style
 *              Use in combination.
 * @return      {{string:object}}
 */
var themeCollection = function(arg) {
    const _popUp_outline = {
            base : `<div id="steamcb" title="Steam Chart builder">
                        <div id="cb-header">
                            <label>검색  </label>
                            <input type="search" class="cb-header-searchBar" placeholder=" Appid 입력 후 엔터"/>
                            <select>
                                <option>eevee</option>
                                <option>sg</option>
                            </select>
                            <button class="cb-header-_addTable">테이블 추가</button>
                        </div>

                        <div id="cb-article" class="cb-connectedSortable"/>

                        <div id="cb-aside">
                            <button class="cb-aside-copyToClip">클립보드 복사</button>
                            <table id="cb-trashbox">
                                <caption>휴지통</caption>
                                <tbody class="cb-connectedSortable">
                                    <tr class="cb-sortable-disabled"><td>-</td></tr>
                                    <tr class="cb-sortable-disabled"><td>-</td></tr>
                                    <tr class="cb-sortable-disabled"><td>-</td></tr>
                                    <tr class="cb-sortable-disabled"><td>-</td></tr>
                                    <tr class="cb-sortable-disabled"><td>-</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div id="cb-message">
                            <input type="checkbox" checked>
                        </div>
                    </div>` },
        table_outline = {
            table : `<table>
                        <thead><tr>
                                <th>Game</th><th>Cards</th><th>Archv</th>
                                <th>BDL</th><th>Lowest</th><th>Retail</th>
                        </tr></thead>
                        <tbody/>
                    </table>`,
            record : `<tr><td>?</td><td>?</td><td>?</td><td>?</td><td>?</td><td>?</td></tr>` },
        default_style = {
            header : `<style type="text/css">
                        #steamcb {
                            padding : 10;
                            font-family : Arial, sans-serif;
                            font-size : 13px;
                        }
                        #steamcb button {
                            cursor : pointer;
                            background-color : transparent;
                            border : 1px solid #CCC;
                        }
                        #steamcb button:hover {
                            color: rgba(255, 255, 255, 0.85); 
                            background-color : rgba(0, 102, 204, 0.5);
                        }
                        #cb-header {
                            float : top;
                            height : 20px;
                            padding : 10px;
                            border-top : 1px solid #CCC;
                            border-bottom : 1px solid #CCC;
                        }
                        #cb-header button.cb-header-_addTable {
                            float : right;
                        }
                        #cb-header select {
                            width : 19px;
                            height : 19px;
                            float : right;
                        }
                        #cb-article {
                            float : left;
                            padding : 10px;
                            width : calc(100% - 130px);
                            height : calc(100% - 200px);
                            overflow : auto;
                        }
                        #cb-aside {
                            float : right;
                            width : 80px;
                            height : calc(100% - 200px);
                            padding : 10px;
                            overflow-x : hidden;
                            overflow-y : auto;
                        }
                        #cb-message {
                            clear : both;
                            height : 100px;
                            padding : 10px;
                            border : .5px solid #CCC;
                            overflow : auto;
                            word-break : break-all;
                        }
                        #cb-message input[type='checkbox'] {
                            float : right;
                        }
                        #cb-trashbox {
                            min-width : 80px;
                            max-width : 80px;
                            margin : 30px 0px;
                            border : .5px solid #CCC;
                            border-spacing : 0px;
                        }
                        #cb-trashbox caption {
                            text-align : left;
                            padding-left : 20px;
                        }
                        #cb-trashbox tr.cb-sortable-disabled {
                            cursor : pointer;
                            opacity: 0;
                        }
                        #cb-trashbox th:not(:first-child),
                        #cb-trashbox td:not(:first-child) {
                            display:none;
                        }
                        </style>` },
        sg_style = {
            table :`border-collapse : collapse;
                    color : rgb(70,86,112);
                    font-family : Arial, sans-serif;
                    font-size : 13px;
                    font-weight : 400;
                    line-height : 20.15px;
                    margin : 0px 0px 15px;
                    table-layout : fixed;
                    text-shadow : 1px 1px rgba(255,255,255,0.94);`,
            thead : `background-color:rgb(232,234,239);
                    border-bottom : 1px solid rgb(70,86,112);
                    font-weight:700;
                    line-height:20.15px;`,
            tfoot : ``,
            th : `  border : 1px solid rgb(210,214,224);
                    padding : 3px 10px 3px 10px;
                    text-align:center;`, 
            thf : ` text-align : left;`,
            thl : ` text-align : center;`,
            tbody : ``,
            td : `  border : 1px solid rgb(210,214,224);
                    padding : 3px 10px 3px 10px;
                    text-align:center;`,
            tdf : ` text-align:left;`,
            tdl : ``},
        eevee_style = {
            table : `border-collapse : collapse;
                    color : #2c2f32;
                    font-family : Arial, sans-serif;
                    margin : 0px 0px 15px;
                    text-shadow : 1px 1px rgba(255,255,255,0.94);`,
            thead : `background-color: #ffdb52;
                    border-top : 1px solid #d7a44f;
                    border-bottom : 2px solid #d7a44f;
                    font-size : 13px;
                    line-height : 25.15px;`,
            tfoot : ``,
            th : `  border : 1px solid #d7a44f;
                    padding : 3px 10px;
                    text-align : center;`,
            thf : ` border-left : 0px;
                    text-align : left;`,
            thl : ` border-right : 0px;`,
            tbody : `line-height : 20.15px;
                    font-weight : 400;
                    color : rgb(70,86,112);`,
            td : `  background-color : #fdf0c8;
                    border : 1px solid #fdcf83;
                    padding : 3px 10px;
                    text-align : center;`,
            tdf : ` border-left : 0px;
                    text-align : left;`,
            tdl : ` border-right : 0px;`};

    switch(arg) {
        case "eevee":
            return {
                outline : Object.assign({}, _popUp_outline, table_outline),
                style : Object.assign({}, default_style, eevee_style) };
        case "sg":
        default:
            return {
                outline : Object.assign({}, _popUp_outline, table_outline),
                style : Object.assign({}, default_style, sg_style) };
    }
};