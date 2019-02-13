// @description  Apply the tablesorter effect to the cb-table.
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.1/js/jquery.tablesorter.min.js
;(async function() {
    await $("<link>", {
        rel : "stylesheet",
        type : "text/css",
        href : "https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.1/css/theme.default.min.css"
    }).appendTo("head");

    
    $('.cb-table').tablesorter({
        textExtraction : function(node) {
            if($(node).find('a').text() === "?" || $(node).find('a').text() === "-") return -1;
            return $(node).find('a').text().replace("%","");
        },
        textSorter : {
            '[name="ratings"]' : function(a, b) {
                const regx = /^[\w\s]+\((\d+)\)/,
                      refa = a==="-1"? -1 : regx.exec(a)[1] ,
                      refb = b==="-1"? -1 : regx.exec(b)[1] ;
                return (refa < refb)? -1 : ((refa > refb)? 1 : 0);
            }
        }
    });

    /* The tablesorter's default theme interferes with my theme. Damn */
    $(".cb-table").find('th').css({'background-color':'transparent'})
    $(".cb-table").find('td').css({'vertical-align':'inherit'});
})();