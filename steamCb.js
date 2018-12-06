/**
 * steamCb - v0.1.20 - 2018-12-05
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
    var setLayout = function(theme, spinner) {
            let $document = $(theme.outline.base); //new

            let dom = { //dom object
                $document : $document,
                $head : $document.find("#cb-header"),
                $article : $document.find("#cb-article"),
                $aside : $document.find("#cb-aside"),
                $message : $document.find("#cb-message"),
                $trashbox : $document.find("#cb-trashbox")
            };
            setEvent(dom, theme, spinner);
            return dom;
        },
        setEvent = function(dom, theme, spinner) {

            /* Connect the tables and apply the sortable */
            dom.$document.find(".cb-connectedSortable")
                    .sortable({ cancel: ".cb-sortable-disabled",
                        connectWith: ".cb-connectedSortable" });

            /* Search bar */
            dom.$head.find("input.cb-header-searchBar")
                    .on("keydown", function (key) {
                        if(key.keyCode == 13) {
                            let gids = $(this).val().split(',').map(gid => gid.trim());

                            if(!dom.$article.children("table").length) //no table
                                addTable(dom.$article, theme);
                            addGames(dom.$article, dom.$head, theme, spinner, gids); }})
                    .attr("disabled","disabled");
            
            /* Informs it is loading. */
            spinner.spin();
            dom.$head.append(spinner.el);
            
            /* Preheat GinfoBuilder */
            GinfoBuilder
                    .preheat() //async
                    .then(() => {
                        dom.$head.find("input.cb-header-searchBar")
                                .removeAttr("disabled");
                        spinner.stop(); })
                    .catch(()=> {/*error code*/});

            /* Add a table */
            dom.$head.find("button.cb-header-addTable")
                    .on("click", function() { 
                        addTable(dom.$article, theme); });

            /* Select a theme */
            dom.$head.find("select")
                    .on("click", function() {
                        theme = themeCollection(this.value); });

            /* Copy to clipboard */
            dom.$aside.find("button.cb-aside-copyToClip")
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
                        })( dom.$article[0]);
                        console.log("Copy");
                        document.execCommand("Copy");});
            
            /* Erase the trashbox */
            dom.$trashbox.find("tbody.cb-connectedSortable")
                    .on("mouseenter", function() { 
                        $(this) .css("cssText", "background: rgba(0, 102, 204, 0.5);")
                                .prev().text("비우기"); })
                    .on("mouseleave", function() {     
                        $(this) .css("cssText", "background: transparent")
                                .prev().text("휴지통"); })
            dom.$trashbox.find("tr.cb-sortable-disabled")
                    .on("click", function() { 
                        $(this).siblings(":not(tr.cb-sortable-disabled)").remove();});

            
            /* Intercept Console */
            var console_capture = function() {
                    window.console.log = function(msg) {
                        dom.$message.append(msg + "<br>"); };
                    window.console.error = function(msg) {
                        dom.$message.append(`<font color="red">` + msg + `</font>` + "<br>"); }; },
                console_release = function() {
                        var i = document.createElement('iframe');
                        i.style.display = 'none';
                        document.body.appendChild(i);
                        window.console = i.contentWindow.console;
                };
            if(dom.$message.find("input:checkbox").is(":checked")) {
                console_capture();
            }
            dom.$message.find("input:checkbox")
                    .on("change", function() {
                        if($(this).is(":checked")) {
                            console_capture();
                        } else {
                            console_release();
                        } });
        },
        popUp = function($document, arg) {
            arg = arg || {width:550, height:750}; //default
            
            if(!$document.hasClass("ui-dialog")) {
                $document
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

            $document.dialog("open");
        },
        popDelete = function($document) {
            $document.dialog("destroy");
        },
        addTable = function($article, theme) {
            const $table = $(theme.outline.table).clone(); //new
            
            $table  .attr("style", theme.style.table)
                    .appendTo($article);

            $table.find("thead")
                    .attr("style", theme.style.thead)
                    .find("th")
                    .attr("style", theme.style.th)
                    .first()
                    .attr("style", theme.style.th+theme.style.thf)
                    .nextAll().last()
                    .attr("style", theme.style.th+theme.style.thl);
                    
            $table.find("tbody")
                    .addClass("cb-connectedSortable")
                    .sortable({connectWith: ".cb-connectedSortable"})
                    .attr("style", theme.style.tbody);

            console.log("A table has been added");
        },
        addGames = function($article, $head, theme, spinner, gids) {
            spinner.spin(); //new
            $head.append(spinner.el);

            GinfoBuilder //async
                .build(gids)
                .then(([gids, ginfo_bundle]) => {
                    gids.forEach(gid => {
                        let $record = $(theme.outline.record).clone(); //new

                        let $data = $record.find("td");
                        
                        $("<a/>").attr("href", ginfo_bundle[gid].url_store)
                                    .text(ginfo_bundle[gid].name + 
                                        (ginfo_bundle[gid].is_dlc===true? " (dlc)":""))
                                    .htmlTo($data.eq(0));

                        
                        if(ginfo_bundle[gid].trading_cards === "?") {
                            $data.eq(1).text("?");
                        } else if(ginfo_bundle[gid].trading_cards) {
                            $("<a/>").attr("href", ginfo_bundle[gid].url_cards)
                                        .text("❤")
                                        .htmlTo($data.eq(1));
                        } else {
                            $data.eq(1).text("-");
                        }

                        if(ginfo_bundle[gid].achievements === "?") {
                            $data.eq(2).text("?");
                        } else if(ginfo_bundle[gid].achievements) {
                            $("<a/>").attr("href", ginfo_bundle[gid].url_archv)
                                        .text("▨")
                                        .htmlTo($data.eq(2));
                        } else {
                            $data.eq(2).text("-");
                        }
                                    
                        $("<a/>").attr("href", ginfo_bundle[gid].url_bundles)
                                    .text(ginfo_bundle[gid].bundles)
                                    .htmlTo($data.eq(3));
                                    
                        $("<a/>").attr("href", ginfo_bundle[gid].url_history)
                                    .text("$ "+ginfo_bundle[gid].lowest_price)
                                    .htmlTo($data.eq(4));
                                    
                        $("<a/>").attr("href", ginfo_bundle[gid].url_price_info)
                                    .text("$ "+ginfo_bundle[gid].retail_price)
                                    .htmlTo($data.eq(5));

                                    
                        $data.attr("style", theme.style.td)
                            .first().attr("style", theme.style.td+theme.style.tdf)
                            .nextAll().last().attr("style", theme.style.td+theme.style.tdl);

                        $article.find("tbody").last()
                                .append($record);
                    });
                    spinner.stop();
                })
                .catch(error => {
                    console.log(error);
                    spinner.stop(); 
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
            this.dom = setLayout(this.theme, this.spinner);
            this.el = this.dom.$document;
            $("head").append($(this.theme.style.header));
        },
        popUp : function(arg) { popUp(this.dom.$document, arg); },
        popDelete : function() { popDelete(this.dom.$document); },
        addTable : function() { addTable(this.dom.$article, this.theme); },
        addGames : function(gids){ addGames(this.dom.$article, this.dom.$head, this.theme, this.spinner, gids);}
    };
}();



/**
 * @method      themeCollection
 * @description This function has the html and css needed to outline and style
 *              Use in combination.
 * @return      {{string:object}}
 */
var themeCollection = function(arg) {
    const popup_outline = {
            base : `<div id="steamcb" title="Steam Chart builder">
                        <div id="cb-header">
                            <label>검색  </label>
                            <input class="cb-header-searchBar" placeholder=" Appid 입력 후 엔터"/>
                            <select>
                                <option>eevee</option>
                                <option>sg</option>
                            </select>
                            <button class="cb-header-addTable">테이블 추가</button>
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
                        #cb-header input.cb-header-searchBar {
                            cols : 40; rows : 5;
                        }
                        #cb-header button.cb-header-addTable {
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
                outline : Object.assign({}, popup_outline, table_outline),
                style : Object.assign({}, default_style, eevee_style) };
        case "sg":
        default:
            return {
                outline : Object.assign({}, popup_outline, table_outline),
                style : Object.assign({}, default_style, sg_style) };
    }
};