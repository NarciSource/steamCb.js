/**
 * @method      cbLayout
 * @description This function has the html and css needed to outline and style
 *              Use in combination.
 * @param       {Object} arg - Combine themes.
 * @param       {string} arg.outline - html
 * @param       {string} arg.style - css
 * @return      {{outline : { window:HTMLElement, table:HTMLElement, record:HTMLElement }, style : { header:string, table:string, thead:string, tfoot:string, th:string, thf:string, thl:string, tbody:string, td:string, tdf:string, tdl:string }}}
 */
var cbLayout = function(arg) {
    const window_outline = {
            base : $(`<div id="steamcb" title="SteamCb">`),

            head : $(`<div id="cb-header"/>`),
            search : $(`<span>
                            <i class="cb-searchIcon fa fa-search"/>
                            <input type="search" class="cb-searchBar" placeholder="게임명 or Appid"/>
                        </span>`),
            
            toolbox : $(`<div class="toolbox"/>`),
            btnAddTable : $(`<i class="cb-btnAddTable fa fa-table"/>`),
            btnDelete : $(`<i class="cb-btnDelete fa fa-trash-o"/>`),
            btnShow : $(`<i class="cb-btnShow fa fa-plus-circle"/>`),
            btnCopyToClip : $(`<i class="cb-btnCopyToClip fa fa-clipboard"/>`),
            btnReset : $(`<i class="cb-btnReset fa fa-exclamation-triangle"/>`),

            article_popup : $(`<div id="cb-article" type="popup" class="cb-connectedSortable"/>`),
            article_side : $(`<div id="cb-article" type="side" class="cb-connectedSortable"/>`),

            aside : $(`<div id="cb-aside"/>`),
            select : $(`<select class="selStyle">
                            <option>eevee</option>
                            <option>sg</option>
                            <option>xmas</option>
                        </select>`),

            trashbox : $(`<table id="cb-trashbox">
                            <caption>휴지통</caption>
                            <tbody class="cb-connectedSortable">
                                <tr class="cb-sortable-disabled"><td>-</td></tr>
                                <tr class="cb-sortable-disabled"><td>-</td></tr>
                                <tr class="cb-sortable-disabled"><td>-</td></tr>
                                <tr class="cb-sortable-disabled"><td>-</td></tr>
                                <tr class="cb-sortable-disabled"><td>-</td></tr>
                            </tbody>
                        </table>`),
                        
            message : $(`<div id="cb-message">
                            <input type="checkbox" checked>
                        </div>`)
        },
        table_outline = {
            table : $(`<table class="cb-table tablesorter">
                        <thead><tr>
                            <th name="game">Game</th>
                            <th name="ratings">Ratings</th>
                            <th name="cards">Cards</th>
                            <th name="archv">Archv</th>
                            <th name="bdl">BDL</th>
                            <th name="lowest">Lowest</th>
                            <th name="retail">Retail</th>
                        </tr></thead>
                        <tbody/>
                    </table>`),
            table_short : $(`<table class="cb-table tablesorter">
                                <thead><tr>
                                    <th name="game">Game</th>
                                    <th name="cards">C</th>
                                    <th name="archv">A</th>
                                    <th name="bdl">B</th>
                                    <th name="lowest">Lowest</th>
                                </tr></thead>
                                <tbody/>
                            </table>`),
            record : $(`<tr><td name="game">?</td>
                            <td name="ratings">?</td>
                            <td name="cards">?</td>
                            <td name="archv">?</td>
                            <td name="bdl">?</td>
                            <td name="lowest">?</td>
                            <td name="retail">?</td></tr>`),
            record_short : $(`<tr><td name="game">?</td>
                                <td name="cards">?</td>
                                <td name="archv">?</td>
                                <td name="bdl">?</td>
                                <td name="lowest">?</td></tr>`),
        },
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
            tdl : ` white-space : nowrap;`},
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
            tdl : ` white-space : nowrap;`},
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
            tdl : ` border-right : 0px;
                    white-space : nowrap;`},
        xmas_style = {
            table : `border-collapse : collapse;
                    color : #FFF;
                    font-family : Arial, sans-serif;
                    margin : 0px 0px 15px;`,
            thead : `background-color: #15854b;
                    border-top : 1px solid #31355b;
                    border-bottom : 2px solid #31355b;
                    font-size : 13px;
                    line-height : 25.15px;`,
            tfoot : ``,
            th : `  border : 1px solid #fff;
                    padding : 3px 10px;
                    text-align : center;`,
            thf : ` border-left : 0px;
                    text-align : left;`,
            thl : ` border-right : 0px;`,
            tbody : `line-height : 20.15px;
                    font-weight : 400;
                    color : #fff;`,
            td : `  background-color : #be3e3f;
                    border : 1px solid #fff;
                    padding : 3px 10px;
                    text-align : center;`,
            tdf : ` border-left : 0px;
                    text-align : left;`,
            tdl : ` border-right : 0px;
                    white-space : nowrap;`,
            a : `color : #fff !important;`};

    let result = {  outline : {/*window, table, record*/}, 
                    style : {/*table, thead, tfoot, th, thf, thl, tbody, td, tdf, tdl*/} };
    /* outline */
    switch(arg.outline) {
        case "popup":
        
            var toolbox = window_outline.toolbox.append([window_outline.btnAddTable,
                                                         window_outline.btnCopyToClip]);
            window_outline.head.append([window_outline.search,
                                        toolbox]);

            window_outline.aside.append([
                window_outline.select, window_outline.trashbox, window_outline.btnReset]);
            result.outline.window = window_outline.base.append([window_outline.head,
                                                                window_outline.article_popup,
                                                                window_outline.aside,
                                                                window_outline.message]);
            result.outline.table = table_outline.table;
            result.outline.record = table_outline.record;
            break;
        case "side":
        default:
            var toolbox = window_outline.toolbox.append([
                                                     window_outline.btnDelete, window_outline.btnShow]);

            window_outline.head.append([window_outline.search,
                                        toolbox]);
            result.outline.window = window_outline.base.append([window_outline.head,
                                                                window_outline.article_side]);
            result.outline.table = table_outline.table_short;
            result.outline.record = table_outline.record_short;
            break;
    }

    /* style */
    switch(arg.style) {
        case "eevee":
            Object.assign(result.style, eevee_style);
            break;
        case "sg":
            Object.assign(result.style, sg_style);
            break;
        case "itcm":
            Object.assign(result.style, itcm_style);
            break;
        case "xmas":
        default:
            Object.assign(result.style, xmas_style);
            break;

    }

    return result;
};