/**
 * @method      themeCollection
 * @description This function has the html and css needed to outline and style
 *              Use in combination.
 * @param       {Object} arg - Combine themes.
 * @param       {string} arg.outline - html
 * @param       {string} arg.style - css
 * @return      {{outline : { window:HTMLElement, table:HTMLElement, record:HTMLElement }, style : { header:string, table:string, thead:string, tfoot:string, th:string, thf:string, thl:string, tbody:string, td:string, tdf:string, tdl:string }}}
 */
var themeCollection = function(arg) {
    const window_outline = {
            base : $(`<div id="steamcb" title="Steam Chart builder">`),

            head : $(`<div id="cb-header">
                    </div>`),
            search : $(`<label>검색  </label>
                        <input type="search" class="cb-header-searchBar" placeholder=" Appid 입력 후 엔터"/>`),
            select : $(`<select>
                            <option>eevee</option>
                            <option>sg</option>
                        </select>`),
            addTable : $(`<button class="cb-header-addTable">테이블 추가</button>`),
            delete : $(`<button class="cb-delete-button">삭제</button>`),

            article_popup : $(`<div id="cb-article" type="popup" class="cb-connectedSortable"/>`),
            article_side : $(`<div id="cb-article" type="side" class="cb-connectedSortable"/>`),

            aside : $(`<div id="cb-aside">
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
                        </div>`),
                        
            message : $(`<div id="cb-message">
                            <input type="checkbox" checked>
                        </div>`)
        },
        table_outline = {
            base : $(`<table class="cb-table">
                        <thead><tr/></thead>
                        <tbody/>
                    </table>`),
            th_name : $(`<th name="game">Game</th>`),
            th_ratings : $(`<th name="ratings">Ratings</th>`),
            th_cards : $(`<th name="cards">Cards</th>`),
            th_archv : $(`<th name="archv">Archv</th>`),
            th_bdl : $(`<th name="bdl">BDL</th>`),
            th_lowest : $(`<th name="lowest">Lowest</th>`),
            th_retail : $(`<th name="retail">Retail</th>`),

            td_name : $(`<td name="game">?</td>`),
            td_ratings : $(`<td name="ratings">?</td>`),
            td_cards : $(`<td name="cards">?</td>`),
            td_archv : $(`<td name="archv">?</td>`),
            td_bdl : $(`<td name="bdl">?</td>`),
            td_lowest : $(`<td name="lowest">?</td>`),
            td_retail : $(`<td name="retail">?</td>`)
        },
        default_style = {
            header : $(`<style type="text/css">
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
                        #cb-header button.cb-header-addTable {
                            float : right;
                        }
                        #cb-header button.cb-delete-button {
                            float : right;
                        }
                        #cb-header select {
                            width : 19px;
                            height : 19px;
                            float : right;
                        }
                        #cb-article[type='popup'] {
                            float : left;
                            padding : 10px;
                            width : calc(100% - 130px);
                            height : calc(100% - 200px);
                            overflow : auto;
                        }
                        #cb-article[type='side'] {
                            float : none;
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
                        </style>`) },
        itcm_style = {
            table :`border-collapse : collapse;
                    color : rgb(70,86,112);
                    font-family : Arial, sans-serif;
                    font-size : 13px;
                    font-weight : 400;
                    line-height : 20.15px;
                    margin : 0px 0px 15px;
                    table-layout : fixed;
                    text-shadow : 1px 1px rgba(255,255,255,0.94);`,
            thead : `background-color:#f6f6f6;
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

    let result = {  outline : {/*window, table, record*/}, 
                    style : {/*header, table, thead, tfoot, th, thf, thl, tbody, td, tdf, tdl*/} };
    /* outline */
    switch(arg.outline) {
        case "popup":
            window_outline.head.append([window_outline.search,
                                        window_outline.select,
                                        window_outline.addTable]);
            result.outline.window = window_outline.base.append([window_outline.head,
                                                                window_outline.article_popup,
                                                                window_outline.aside,
                                                                window_outline.message]);
            result.outline.table = table_outline.base;
            table_outline.base.find("tr").append([table_outline.th_name,
                                                table_outline.th_ratings,
                                                table_outline.th_cards,
                                                table_outline.th_archv,
                                                table_outline.th_bdl,
                                                table_outline.th_lowest,
                                                table_outline.th_retail]);
            result.outline.record = $(`<tr/>`).append([table_outline.td_name,
                                                        table_outline.td_ratings,
                                                        table_outline.td_cards,
                                                        table_outline.td_archv,
                                                        table_outline.td_bdl,
                                                        table_outline.td_lowest,
                                                        table_outline.td_retail]);
            break;
        case "side":
        default:
            window_outline.head.append([window_outline.search,
                                        window_outline.delete]);
            result.outline.window = window_outline.base.append([window_outline.head,
                                                                window_outline.article_side]);
            result.outline.table = table_outline.base;
            table_outline.base.find("tr").append([table_outline.th_name,
                                            table_outline.th_cards,
                                            table_outline.th_archv,
                                            table_outline.th_bdl,
                                            table_outline.th_lowest]);
            result.outline.record = $(`<tr/>`).append([table_outline.td_name,
                                                        table_outline.td_cards,
                                                        table_outline.td_archv,
                                                        table_outline.td_bdl,
                                                        table_outline.td_lowest]);
            break;
    }

    /* style */
    Object.assign(result.style, default_style);
    switch(arg.style) {
        case "eevee":
            Object.assign(result.style, eevee_style);
            break;
        case "sg":
            Object.assign(result.style, sg_style);
            break;
        case "itcm":
        default:
            Object.assign(result.style, itcm_style);
            break;

    }

    return result;
};