if (typeof GM === "undefined") {
    GM = this.GM || {};
}

;(function GreasemonkeyCompatibility(GM) {
    if (GM === undefined) {
        console.warn("Can't find Greasemonkey Object.");
        return;
    }


    GM.xmlHttpRequest = GM.xmlHttpRequest || GM_xmlhttpRequest;
    GM.setValue = GM.setValue || GM_setValue;
    GM.getValue = GM.getValue || (arg => Promise.resolve(GM_getValue(arg)));
    GM.deleteValue = GM.deleteValue || GM_deleteValue;
    GM.info = GM.info || GM_info;

    GM.setItem = GM.setValue;
    GM.getItem = GM.getValue;
    GM.removeItem = GM.deleteValue;

    GM.getResourceUrl = (function () {
        if (GM.getResourceUrl) {
            const origin_getResourceUrl = GM.getResourceUrl;

            return async (url, type) => {
                if (type) {
                    let blob_url = await origin_getResourceUrl(url),
                        blob = await fetch(blob_url).then(r => r.blob()),
                        new_blob = blob.slice(0, blob.size, type),
                        new_blob_url = URL.createObjectURL(new_blob);

                    return new_blob_url;
                }
                else {
                    return origin_getResourceUrl(url);
                }
            };
        }
        else {
            return (url, type) => {
                let res = GM_getResourceURL(url).replace("text/plain", type || "text/plain");

                return Promise.resolve(res);
            };
        }
    })();

    GM.addStyle = (data, option) => {
        let head = document.getElementsByTagName('head')[0];
        if (head) {
            if (option === "resource") {
                async function fn(url) {
                    let link = document.createElement('link');
                    link.setAttribute('rel', 'stylesheet');
                    link.setAttribute('type', 'text/css');
                    link.setAttribute('href', await GM.getResourceUrl(url, 'text/css'));
                    head.appendChild(link);
                }

                if (data instanceof Array) {
                    data.forEach(each => fn(each));
                }
                else {
                    fn(data);
                }
            }
            else {
                let style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                style.textContent = data;
                head.appendChild(style);
            }
        }
        return head;
    }

    GM.ajax = function (url, options) {
        options = options || { url };
        if (typeof url === "object") {
            options = url;
            url = undefined;
        }
        console.info(options.type || "GET", options.url);


        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest(Object.assign({}, options, {
                method: "GET",
                onload: response => {
                    const headerRegex = /([\w-]+): (.*)/gi,
                        mimeRegex = /(^\w+)\/(\w+)/g;

                    let headers = {}, match;
                    while (match = headerRegex.exec(response.responseHeaders)) {
                        headers[match[1].toLowerCase()] = match[2].toLowerCase();
                    }

                    const [mime, mime_type, mime_subtype] = mimeRegex.exec(headers["content-type"]);
                    switch (mime_subtype) {
                        case "xml":
                            resolve(new DOMParser().parseFromString(response.responseText, mime));
                            break;
                        case "json":
                            resolve(JSON.parse(response.responseText));
                            break;
                    }
                    resolve(response.responseText);
                },
                onerror: error => reject(error)
            }));

        });
    };
})(GM);