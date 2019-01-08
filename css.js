/* !-- Modified the code for personal parsing. -- */

/* jshint unused:false */
/* global window, console */
(function(global) {
    'use strict';
    var fi = function() {
      this.combinedCSSRegex = '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})'; //to match css & media queries together
      this.cssCommentsRegex = '(\\/\\*[\\s\\S]*?\\*\\/)';
    };
  
    /*
      Parses given css string, and returns css object
      keys as selectors and values are css rules
      eliminates all css comments before parsing
  
      @param source css string to be parsed
      @return object css
    */
    fi.prototype.parseCSS = function(source) {
  
      if (source === undefined) {
        return [];
      }
  
      var css = {};
      var arr;
  
      //unified regex
      var unified = new RegExp(this.combinedCSSRegex, 'gi');
  
      while (true) {
        arr = unified.exec(source);
        if (arr === null) {
          break;
        }
        var selector = '';
        if (arr[2] === undefined) {
          selector = arr[5].split('\r\n').join('\n').trim();
        } else {
          selector = arr[2].split('\r\n').join('\n').trim();
        }
  
        /*
          fetch comments and associate it with current selector
        */
        var commentsRegex = new RegExp(this.cssCommentsRegex, 'gi');
        var comments = commentsRegex.exec(selector);
        if (comments !== null) {
          selector = selector.replace(commentsRegex, '').trim();
        }
  
        // Never have more than a single line break in a row
        selector = selector.replace(/\n+/, "\n");
  
        //we have standard css
        css[selector] = {
            rules: arr[6].split('\n').map(each=>each.trim()).join('\n')
        };
        
        if (comments !== null) {
            css[selector].comments = comments[0];
        }
      }
  
      return css;
    };

    global.cssjs = fi;

  })(this);
  