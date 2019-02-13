/**
 * steamCb - v0.4.10 - 2019-02-14
 * @requires jQuery v3.3.1+ (https://api.jquery.com/)
 * @requires jQuery-ui v1.12.1+ (https://api.jqueryui.com/)
 * @requires require v2.3.6 (https://requirejs.org/docs/)
 * @requires ace v1.4.2 (https://ace.c9.io/)
 * @requires tablesorter v2.31.1 (https://mottie.github.io/tablesorter/docs/)
 * @requires fontawesome v4.7.0 (https://fontawesome.com/v4.7.0/)
 * @requires magicsuggest v2.1.4 (http://nicolasbize.com/magicsuggest/doc.html)
 * @requires contextMenu v2.8.0 (https://swisnl.github.io/jQuery-contextMenu/docs.html)
 * 
 * https://github.com/NarciSource/steamCb.js
 * Copyright 2018-2019. Narci. all rights reserved.
 * Licensed under the MIT license
 */

 ;(function ($, window, document, undefined) {
    $.widget( "nar.steamCb", {
        version: "0.4.10",
        options: {
            idTag: 'defaultCb',
            theme: '.default',
            width: 'auto',
            height: 'auto',
        },

        _create: function() {
            console.info("new steamCb");

            /* shortcut */
            this.dashboard = this.element.find('.cb-dashboard');
            this.article = this.element.find('.cb-article');
            this.setting = this.element.find('.cb-setting');

            this.editors = {};
            this.commands = [];

            /* table focus */
            this.focused_table = $(/*null*/);            

            /* visable dashboard / hide setting */
            this.setting.hide();

            /* Set the working zone of the pregressbar. */
            this._____search_progressbar_zone_____ = new Zone({
                    start: ()=> this.element.find('.cb-search__progressbar').show(),
                    end: ()=> this.element.find('.cb-search__progressbar').hide(),
                    monitor: true
                }).simply();

            this._____setting_progressbar_zone_____ = new Zone({
                    start: ()=> this.setting.find('.cb-setting__progressbar').show(),
                    end: ()=> this.setting.find('.cb-setting__progressbar').hide(),
                }).simply();


            /* priority: localStorage(user) > create option(code) */
            this._downloadLocalStorage();
            this._updateLocalStorage();


            this._setEvent();
            this._preheat();
        },

        _init: function() {
            console.log("init");
        },

        _setEvent: function() {
            const that = this, //To keep the scope within the callback
                  KEYCODES = {
                    BACKSPACE: 8,
                    TAB: 9,
                    ENTER: 13,
                    CTRL: 17,
                    ESC: 27,
                    SPACE: 32,
                    DELETE: 46,
                    COMMA: 188
                  };

            /*------- Search bar -------*/
            this.searchEngine = (function ($search, $search_bar, $search_icon, $searchCategory) {
                let process = function() {
                        that.addGames( searchEngine.getSelection().filter(s=>s.id).map(s=>({div:s.div, id:s.id})) );
                        searchEngine.clear();
                };

                /* search category */
                var category = 'app'; //default
                $searchCategory
                        .on('change', function() {
                            category = this.value;
                            searchEngine.setData( that.searchList[ category ] );
                        });
                
                /* search bar */
                var searchEngine = $search_bar
                        .magicSuggest({
                            valueField: 'name',
                            minChars: 3,
                            maxSelection: 20,
                            sortOrder: 'name', sortDir: 'asc',
                            strictSuggest: false,
                            useCommaKey: true,
                            useTabKey: true,
                            selectionRenderer: (data, classes)=> {
                                if (data.div === undefined) {
                                    data.div = category;
                                }
                                if (data.id === undefined && $.isNumeric(data.name)) {
                                    data.id = data.name;
                                    data.name = data.div+"/"+data.id;
                                }

                                if (data.id === undefined) {
                                    classes.push('ms-sel-item--fail');
                                } else if (data.name === data.div+'/'+data.id) {
                                    classes.push('ms-sel-item--fast');
                                } else {
                                    classes.push(`ms-sel-item--${data.div}`);
                                }
                                return data.name;
                            }
                        });

                        
                $(searchEngine)
                        .on({
                            keydown: function(e,m,v) {
                                if(v.keyCode == KEYCODES.ENTER) {
                                    process();
                                }
                            },
                            focus: function() {
                                $.merge($search, $searchCategory).addClass('cb-search--focus');
                            },
                            blur: function() {
                                $.merge($search, $searchCategory).removeClass('cb-search--focus');
                            }
                        });
                        
                /* search icon */
                $search_icon
                        .on('click', process);

                /* progress bar */
                $search.progressbar({
                            classes: {'ui-progressbar-value':'cb-search__progressbar'},
                            value: false
                        })
                    .find('.cb-search__progressbar')
                        .hide(); //init

                return searchEngine;
                        
            })( that.element.find('.cb-search'), that.element.find('#cb-search__bar'), 
                that.element.find('#cb-search__icon'), that.element.find('#cb-search__category') );            
            
                    
            /*------- Table focus release -------*/
            this.article
                    .attr('tabindex',0)
                    .on({
                        focus: function() {
                            that.focused_table.toggleClass('cb-tablehighlight');
                            that.focused_table = $(/*null*/);//release
                        },
                        keyup: function(event) {
                            if(event.which === KEYCODES.DELETE) {
                                that.focused_table.remove();
                                that.focused_table = $(/*null*/);//release
                            }
                        }
                    });


            /*------- Parses classes from the stylesSheet. -------*/
            (function(styleSheet, $select) {
                let doc = document.implementation.createHTMLDocument(''),
                    styleElement = document.createElement('style');

                styleElement.textContent = styleSheet;
                doc.body.appendChild(styleElement);

                let cssRules = styleElement.sheet.cssRules,  classes = new Set();

                Object.values(cssRules).forEach(cssRule=> classes.add( /^.\w+/.exec(cssRule.selectorText)[0] ) );

                classes.forEach(classname=> {
                    $select.append(
                        new Option(classname.substring(1).toUpperCase(), classname)
                    );
                });
            })(this.options.style, this.element.find('#cb-sel-style__select'));

            this.element.find('#cb-sel-style__select').val( this.options.theme );


            /*------- Select a theme -------*/
            this.element.find('#cb-sel-style__select')
                    .on('click', function() {
                        that.options.theme = this.value;
                        that._updateLocalStorage(); })
                    .on('change', function() {
                        console.info(`The table theme changed to ${this.value}`)});


            /*------- Hides/show the article -------*/
            (function ($btnShow, $article) {
                if( $btnShow.length === 0 ) return;
                if( localStorage["side-show"] === "hide" ) {
                    $btnShow.switchClass('fa-plus-circle', 'fa-minus-circle');
                    $article.hide();
                } else {
                    $btnShow.switchClass('fa-minus-circle', 'fa-plus-circle');
                    $article.show();
                }

                $btnShow.on('click', function() {
                    $(this).toggleClass('fa-plus-circle fa-minus-circle');
                    if($(this).hasClass('fa-plus-circle')) {
                        $article.show();
                        localStorage["side-show"] = "show";
                    } else {
                        $article.hide();
                        localStorage["side-show"] = "hide";
                    }
                })
            })(this.element.find('#cb-btn--show'), this.article);


            /*------- Erase the trashbox -------*/
            this.element.find('.cb-trashbox').find('tr.cb-sortable-disabled')
                    .on('click', function() { 
                        $(this) .siblings().not('tr.cb-sortable-disabled')
                                .remove();
                        console.info("Erase"); });


            
            
            /*------- Copy to clipboard -------*/
            $.fn.copyToClipboard = function() {
                if (!$.contains(document, this)) {
                    var isNotContain = true;
                    $('body').append(this);
                }

                let body = document.body, range, sel;
                if (document.createRange && window.getSelection) {
                    sel = window.getSelection();
                    sel.removeAllRanges();
                    range = document.createRange();
                    try {
                        range.selectNodeContents(this.get(0));
                    } catch (e) {
                        range.selectNode(this.get(0));
                    } finally {
                        sel.addRange(range);
                    }
                } else if (body.createTextRange) {
                    range = body.createTextRange();
                    range.moveToElementText(this.get(0));
                    range.select();
                }
                document.execCommand('Copy');
                console.info("Copied to clipboard");

                if(isNotContain) {
                    this.detach();
                }
                return this;
            };
            $.fn.tableDirtRemoval = function() {
                this.find('*').addBack()
                        .removeClass()
                        .removeAttr()
                    .filter('table')
                        .addClass('cb-table')
                        .trigger('updateAll')
                    .find('th')
                        .css({  'user-select': 'text',
                                '-moz-user-select': 'text',
                                '-webkit-user-select': 'text',
                                '-ms-user-select': 'text'});
                return this;
            };



            /*------- Add context menu to table -------*/
            this.element
                .contextMenu({
                    selector: '.cb-article',
                    callback: function(key, options) {
                        switch(key) {
                            case "copy":
                                this.clone()
                                    .tableDirtRemoval()
                                    .copyToClipboard();
                                break;
                            case "addTable":
                                that.addTable();
                                break;
                            case "delete":
                                this.children().remove();
                                that.focused_table.remove();
                                that.focused_table = $(/*null*/); 
                                break;
                            case "adjustment":
                                this.children().engraveStyle({
                                    styleSheet: that.options.style, 
                                    classFilter: that.options.theme
                                });
                                break;
                        }
                    },
                    items: {
                        addTable: {name: "Add table", icon: 'fa-table'},
                        step1: "---------",
                        delete: {name: "Clear", icon: 'fa-trash-o'},
                        step2: "---------",
                        adjustment: {name: "Theme adjustment", icon: 'fa-pencil-square-o'},
                        copy: {name: "Copy all to clipboard", icon: 'fa-clipboard'}
                    }
                })
                .contextMenu({
                    selector: '.cb-table > thead',
                    callback: function(key, options) {
                        switch(key) {
                            case "copy": 
                                this.parent('table').clone()
                                    .tableDirtRemoval()
                                    .copyToClipboard();
                                break;
                            case "delete":
                                this.parent('table').remove();
                                that.focused_table.remove();
                                that.focused_table = $(/*null*/);
                                break;
                            case "adjustment":
                                this.parent('table').engraveStyle({
                                    styleSheet: that.options.style, 
                                    classFilter: that.options.theme
                                });
                                break;
                        }
                    },
                    items: {
                        delete: {name: "Delete the table", icon: 'fa-trash-o'},
                        step1: "---------",
                        adjustment: {name: "Theme adjustment", icon: 'fa-pencil-square-o'},
                        copy: {name: "Copy the table to clipboard", icon: 'fa-clipboard'}
                    }
                })
                .contextMenu({
                    selector: '.cb-table > tbody > tr',
                    callback: function(key, options) {
                        switch(key) {
                            case "copy":
                                this.closest('table').clone()
                                    .tableDirtRemoval()
                                    .copyToClipboard();
                                break;
                            case "delete":
                                this.remove();
                                break;
                            case "adjustment":
                                this.engraveStyle({
                                    styleSheet: that.options.style, 
                                    classFilter: that.options.theme
                                });
                                break;
                        }
                    },
                    items: {
                        delete: {name: "Delete the record", icon: 'fa-trash-o'},
                        step1: "---------",
                        adjustment: {name: "Theme adjustment", icon: 'fa-pencil-square-o'},
                        copy: {name: "Copy the table to clipboard", icon: 'fa-clipboard'}
                    }
                });


            /*------- Setting tab -------*/
            this.dashboard.find('#cb-btn--setting-in')
                    .on('click', ()=> {
                        this.setting.show();
                        this.dashboard.hide();
                    });
            this.setting.find('#cb-btn--setting-out')
                    .on('click', ()=> {
                        this.setting.hide();
                        this.dashboard.show();
                    });

            this.setting.find('#cb-setting__option--hyperlink')
                    .on('change', function() {
                        that.article.on('click','a', event=> {
                            if(this.checked === false) {
                                event.preventDefault();
                            } else {
                                return true;
                            }
                        });
                    })
                    .prop('checked', this.options.hyperlink)
                    .change();

            this.setting.find('.cb-setting__progressbar')
                    .progressbar({value: false})
                    .hide();


            /*------- Code edit div -------*/
            this.editors = (function($setting, options) {
                let res = {};

                ace.config.set('basePath', '/ace-builds/src-noconflict');
                
                res.field = ace.edit(
                    $setting.find('#cb-setting__option--field')[0], {
                    mode: 'ace/mode/json',
                });

                res.record = ace.edit(
                    $setting.find('#cb-setting__option--record')[0], {
                    mode: 'ace/mode/json',
                });

                res.styleSheet = ace.edit(
                    $setting.find('#cb-setting__option--styleSheet')[0], {
                    mode: 'ace/mode/css',
                    //theme: 'ace/theme/tomorrow_night_eighties'
                });

                res.styleSheet.setValue( options.style );
                res.field.setValue( JSON.stringify(options.field, null, 2) );
                res.record.setValue( JSON.stringify(options.record, null, 2) );

                return res;
            })(this.setting, this.options);
            

            this.element.find('#cb-btn--save')
                    .on('click', ()=> {
                        this._____setting_progressbar_zone_____(()=> {
                            this.options.style = this.editors.styleSheet.getValue();
                            this.options.field = JSON.parse( this.editors.field.getValue() );
                            this.options.record = JSON.parse( this.editors.record.getValue() );
                            
                            this._updateLocalStorage();    
                        }, {
                            mintime:1000*1
                        }).then(()=>console.info("Saved setting"));
                    });



                    
            /*------- Reset DB and stroage -------*/
            this.element.find('#cb-btn--reset')
                    .on('click', function () {
                        $('<div>').dialog({
                            title: "Warning",
                            width: 400,
                            closeText: "",
                            show: { effect: 'bounce', duration: 2000 },
                            hide: { effect: 'clip', duration: 200 },
                            classes: {
                                'ui-dialog':'cb-dialog',
                                'ui-dialog-title':'cb-dialog-title--alert',
                                'ui-dialog-titlebar':'ui-dialog-titlebar cb-dialog-titlebar cb-dialog-titlebar--alert',
                                'ui-dialog-titlebar-close':'cb-dialog-titlebar-close',
                                'ui-dialog-content':'cb-dialog-content--alert',
                                'ui-dialog-buttonpane':'cb-dialog-buttonpane--alert',
                                'ui-dialog-buttonset':'cb-dialog-buttonset--alert'
                            },
                            open: function() { 
                                $(this).parent().find('.ui-icon-closethick').switchClass('ui-icon ui-icon-closethick','cb-icon-closethick fa fa-times',0);
   
                                $(this).append($('<p>', {text: "This action clears the db and requests a list of all games from the Steam Server." }))
                                        .append($('<p>', {text: "If you would like to update newly released game on Steam, please continue this action."}))
                                        .append($('<p>', {text: "This process takes a few minutes after this page refresh."}))
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
                                    class: 'cb-dialog-button--alert'
                                }
                            }
                        }).dialog('open');
                    });



  
            /*------- Connect the tables and apply the sortable -------*/
            this.element.find('.cb-connectedSortable')
                    .sortable({ cancel: '.cb-sortable-disabled',
                                connectWith: '.cb-connectedSortable' });
            

            /*------- Intercept Console -------*/
            (function ($message) {
                let console_capture = function() {
                            window.console.info = function() {
                                for (let i=0; i<arguments.length; i++) {
                                    $message.append(arguments[i]+" ");
                                }
                                $message.append('<br>');
                            };
                            window.console.warn = function() {
                                $message.append('<font color="red">');
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
                if($message.find('input:checkbox').is(':checked')) {
                    console_capture.call(that);
                }
                $message.find('input:checkbox')
                        .on('change', function() {
                            if($(this).is(':checked')) {
                                console_capture.call(that);
                            } else {
                                console_release.call(that);
                            }
                });
                $message.on('DOMNodeInserted', function() {
                            $(this).scrollTop($(this).prop('scrollHeight'));
                });
            })( this.element.find('.cb-message') );



            /*------- Record $article's contents in sessionStorage -------*/
            let observer = new MutationObserver(function(mutations) {
                    that.commands = [];
                    that.article.find('table.cb-table').each((_, table) => {
                        that.commands.push("table");
                        $(table).find('tbody tr').each((_, tr) =>
                            that.commands.push($(tr).attr('gid')) );
                    });
                    sessionStorage[`${that.options.idTag}-commands`] = JSON.stringify(that.commands);
                    
                    //mutations.forEach(function(mutation) {
                    //  console.log(mutation);
                    //});
            });
            $.fn.observe = function(option) {
                observer.observe(this.get(0), option || {childList: true});
            };
            this.article.observe({childList: true, subtree: true});
        },

        _preheat: function() {
            this._____search_progressbar_zone_____(async ()=> {
                /* GinfoBuilder preheat */
                console.info("preheat: Loading DB.");
                await GinfoBuilder.preheat();


                /* Return previous memory */
                console.info("preheat: Loading previous table.");
                if (sessionStorage[`${this.options.idTag}-commands`]) {
                    this.commands = JSON.parse(sessionStorage[`${this.options.idTag}-commands`]);

                    let $table;
                    this.commands.forEach(async command => {
                        switch(command) {
                            case "table": 
                                $table = this.addTable();
                                break;
                            default: 
                                this.addGames([{ div: command.split("/")[0],
                                                 id: command.split("/")[1]}], $table);
                                break;
                        }
                    });
                }

                
                /* Load search list */
                console.info("preheat: Loading Search list.")
                this.searchList = localStorage["searchList"];
                if(!this.searchList) {
                    const dataType = function(value) {
                        if(value.name === undefined) {
                            return {name: value.plain, id: value.id};
                        }else {
                            return {name: value.name, id: value.id};
                        }
                    };
                    
                    this.searchList = { app: await idxDB.readAll("app",dataType),
                                        sub: await idxDB.readAll("sub",dataType),
                                        bundle: await idxDB.readAll("bundle",dataType) };
                    localStorage["searchList"] = JSON.stringify(this.searchList);

                } else {
                    this.searchList = JSON.parse(this.searchList);
                }
                
                /* Insert initial data into the serach engine. */
                this.searchEngine.setData(this.searchList["app"]);
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
                    show: { effect: 'scale', duration: 1000 },
                    hide: { effect: 'clip', duration: 500 },
                    width: arg.width, height: arg.height,
                    classes: {
                        'ui-dialog':'cb-dialog',
                        'ui-dialog-titlebar':'ui-dialog-titlebar cb-dialog-titlebar',
                        'ui-dialog-title':'cb-dialog-title',
                        'ui-dialog-titlebar-close':'cb-dialog-titlebar-close'
                    },
                    open: function(event, ui) {
                        $(this).parent().find('.cb-dialog-titlebar')
                            .append($('<i>', {
                                class: 'fa fa-steam cb-dialog-titlebar__steam-icon'
                            }));
                        $(this).parent().find('.ui-icon-closethick').switchClass('ui-icon ui-icon-closethick','cb-icon-closethick fa fa-times',0);
                    },
                    resizeStop: function() {
                        that.options.width = $(this).width();
                        that.options.height = $(this).height();
                        that._updateLocalStorage();
                    }
                });
        },

        popDelete: function() {
            this.element.dialog('destroy');
        },

        addTable: function() {
            let that = this;

            return $('<table>', {
                class: 'cb-table',
                attr: { tabindex:0 },
                html: $.merge(
                    $('<thead>', {
                        html: $('<tr>', {
                                html: $.map( that.options.field, (text, name)=> 
                                        $('<th>', { name, text })
                                    )
                            })
                    }),
                    $('<tbody>', { /* connect sortable */
                        class: 'cb-connectedSortable',
                        sortable: { connectWith: '.cb-connectedSortable' }
                    })
                ),
                on: {
                    mouseup: function() {
                        $(this) .focus();
                    },
                    focusin: function() { /* focus selected table */
                        that.focused_table.toggleClass('cb-tablehighlight');
                        that.focused_table = $(this);
                        that.focused_table.toggleClass('cb-tablehighlight');
                    }
                },
                engraveStyle: { /* engrave style */
                    styleSheet: that.options.style, 
                    classFilter: that.options.theme
                },
                tablesorter: { /* sorter */
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
                }
            }).focusin().appendTo(this.article);
        },


        addGames: async function(gids, $table) {
            await this._____search_progressbar_zone_____(async()=> {

                $table = $table || this.focused_table.length? this.focused_table : this.addTable();

                /* make */
                const $tr = $('<tr>', {
                        html: $.map( this.options.record, (text, name)=> 
                                $('<td>', { name, text })
                        )
                    }),
                    glist = await GinfoBuilder.build(gids);

                /* writing record */
                let records = $.map( glist, ginfo => {
                    //console.log(ginfo);
                    let $record = $tr.clone();

                    /* record identification */
                    $record.attr('gid',ginfo.div+"/"+ginfo.id);

                    /* game field */
                    $record.find(`td[name="title"]`).html( 
                        $('<a>', {
                            href: ginfo.urls_store,
                            text: (ginfo.name? ginfo.name:ginfo.plain) + (ginfo.is_dlc===true? " (dlc)":"")}
                        )
                    );

                    /* img field */
                    $record.find(`td[name="img"]`).html( $.merge(
                        $('<div>', {
                            css: {'background-image' : `url(${ginfo.urls_img})`}
                        }),
                        $('<a>', {
                            href: ginfo.urls_store,
                            text: (ginfo.name? ginfo.name:ginfo.plain) + (ginfo.is_dlc===true? " (dlc)":"")
                        })
                    ));

                    /* ratings field */
                    $record.find(`td[name="ratings"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            case null : return $('<a>', { text: "-"});
                            default : return $('<a>', { text : `${val.steam.text} (${val.steam.perc_positive}%)`});
                        }
                    })(ginfo.reviews) );
                    
                    /* cards field */
                    $record.find(`td[name="cards"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            case false : return $('<a>', { text: "-"});
                            case true : return $('<a>', {
                                                    href: ginfo.urls_cards,
                                                    text: "❤"
                                                });
                        }
                    })(ginfo.trading_cards) );

                    /* achievements field */
                    $record.find(`td[name="archvment"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            case false : return $('<a>', { text: "-"});
                            case true : return $('<a>', {
                                                    href: ginfo.urls_archv,
                                                    text: "▨" 
                                                });
                        }
                    })(ginfo.achievements) );
                    
                    /* bundles field */
                    $record.find(`td[name="bundles"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            default : return $('<a>', {
                                                    href: ginfo.urls.bundles,
                                                    text: val.count
                                                });
                        }
                    })(ginfo.bundles) );

                    /* lowest field */
                    $record.find(`td[name="lowest"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            default : return $('<a>', {
                                                    href: ginfo.urls.history,
                                                    text: "$"+val.price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,") 
                                                });
                        }
                    })(ginfo.lowest_price) );
                    
                    /* lowest-detail field */
                    $record.find(`td[name="lowest_detail"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            default : return $.merge(
                                                $('<a>', {
                                                    href: ginfo.urls.history,
                                                    text: "$"+val.price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")+` (${val.cut}% off)`
                                                }),
                                                $('<div>', {
                                                    text: `${new Date(Date.now()-val.recorded).toDateString()}`
                                                })
                                            );
                        }
                    })(ginfo.lowest_price) );

                    /* current field */
                    $record.find(`td[name="current"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            default : return $('<a>', {
                                                    href: val.url,
                                                    text: "$"+val.price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")+` (${val.cut}% off)`
                                                });
                        }
                    })(ginfo.store_price) );
                    
                    /* retail field */
                    $record.find(`td[name="retail"]`).html((val => {
                        switch(val) {
                            case undefined : return $('<a>', { text: "?"});
                            default : return $('<a>', {
                                                    href: ginfo.urls.info,
                                                    text: "$"+val.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&","")
                                                });
                        }
                    })(ginfo.retail_price));

                    return $record.get();
                });

                /* engrave style */
                $(records).engraveStyle({
                            styleSheet: this.options.style, 
                            classFilter: this.options.theme
                        });

                /* update tablesorter */
                $table.trigger('updateAll');

                /* Add records to the focused table. */
                $table.children('tbody').append(records);
            })
            .then(()=>console.info("Added games"))
            .catch(()=>console.warn("error"));
        }
    });

    
    /**
     * The engraveStyle plugin parses the stylesheet and engraves the selected class into the object.
     * */
    $.fn.engraveStyle = function({styleSheet, classFilter}) {
        classFilter = classFilter || '';
        const parentFilter = '.default',
        
              doc = document.implementation.createHTMLDocument(''),
              styleElement = document.createElement('style');

        styleElement.textContent = styleSheet;
        doc.body.appendChild(styleElement);

        const cssRules = styleElement.sheet.cssRules;
        Object.values(cssRules)
            .filter(cssRule=> cssRule.selectorText.includes(classFilter) || cssRule.selectorText.includes(parentFilter) )
            .forEach(cssRule=> {
                const selectors = cssRule.selectorText
                                    .split( /,\s*/ )
                                    .filter(selector=> selector.includes(classFilter) || selector.includes(parentFilter) )
                                    .map(selector=> selector.replace(classFilter,'').replace(parentFilter,'').trim()),
                      styles = cssRule.style;

                selectors.filter(selector=> this.find(selector).addBack(selector).length)
                         .forEach(selector=> {
                            for (let i=0;i<styles.length;i++) {
                                const property = styles[i],
                                      value = styles[property];

                                this.find(selector).addBack(selector).css(property, value);
                            }
                        });
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
};