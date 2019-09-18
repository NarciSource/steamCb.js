EasyIndexedDB = function ({dbName, version, primaryKey, defaultTable, tables, candidateKey}) {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
    // (Mozilla has never prefixed these records, so we don't need window.mozIDB*)

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")
    }

    var db;

    var loadDB = function () {
        if (db === undefined) {
            return new Promise(function (resolve, reject) {
                let request = window.indexedDB.open(dbName, version);
                request.onsuccess = function (res) {
                    db = res.target.result;
                    console.info("request success");
                    resolve();
                }
                request.onerror = function (res) {
                    window.alert("Database error: " + res.target.errorCode);
                }
                request.onupgradeneeded = function (res) { // upgrade.then=>success
                    db = res.target.result;
                    console.info("request upgrade");

                    if (1 < res.oldVersion && res.oldVersion < version) {
                        tables.forEach(table => db.deleteObjectStore(table));
                        localStorage.clear();//???????????????????????????????????????????????????
                        sessionStorage.clear();
                    }


                    tables.forEach(table =>
                        db.createObjectStore(table, { keyPath: primaryKey }));
                    //objectStore.createIndex(candidateKey, candidateKey, { unique: true });
                }
            });
        } else {
            return Promise.resolve();
        }
    };


    return {
        write: async function (table, records) {
            await loadDB();

            return new Promise(function (resolve, reject) {
                let transaction = db.transaction(table, "readwrite");
                transaction.oncomplete = () => { //callback
                    console.info("Write transaction success");
                    resolve();
                }
                transaction.onerror = () => {
                    console.warn("Write transaction error");
                    reject();
                }
                let objectStore = transaction.objectStore(table);


                records.forEach(record =>
                    objectStore.add(record)
                );
            });
        },
        /** @function    read (async)
         *  @description 
         *  @param       {string} table
         *  @param       {number[]} keys   
         *  @return      {Promise<gdata>} */
        read: async function (table, keys) {
            await loadDB();
            var records = [];

            return new Promise(function (resolve, reject) {
                let transaction = db.transaction(table, "readonly");
                transaction.oncomplete = () => {
                    console.log("Read transaction success");
                    resolve(records);
                }
                transaction.onerror = () => {
                    console.warn("Read transaction error");
                    reject();
                }
                let objectStore = transaction.objectStore(table);


                keys.forEach(key => {
                    var readRequest = objectStore.get(key);
                    readRequest.onsuccess = function (event) {
                        if (event.target.result !== undefined) {
                            records.push(event.target.result);
                        }
                    };
                });
            });
        },
        readAll: async function (table, dataType) {
            await loadDB();
            var records = [];

            return new Promise(function (resolve, reject) {
                let transaction = db.transaction(table, "readwrite");
                transaction.oncomplete = () => {
                    console.log("ReadAll transaction success");
                }
                transaction.onerror = () => {
                    console.error("ReadAll transaction error");
                }
                let objectStore = transaction.objectStore(table);


                objectStore.openCursor().onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        records.push(dataType(cursor.value));
                        cursor.continue();
                    } else {
                        resolve(records);
                    }

                }
            });
        },
        isExist: async function (table, keys) {
            await loadDB();
            var exist = [],
                notexist = [];

            return new Promise(function (resolve, reject) {
                let transaction = db.transaction(table, "readonly");
                transaction.oncomplete = () => {
                    console.log("isExist transaction success");
                    resolve([exist, notexist]);
                }
                transaction.onerror = () => {
                    console.warn("isExist transaction error");
                    reject();
                }
                let objectStore = transaction.objectStore(table);

                keys.forEach(key => {
                    var readRequest = objectStore.get(key);
                    readRequest.onsuccess = function (event) {
                        exist.push(event.target.result.id);
                    };
                    readRequest.onerror = function (event) {
                        notexist.push(event.target.result.id);
                    }
                });
            });
        },
        isEmpty: async function () {
            await loadDB();

            return new Promise(function (resolve, reject) {
                let objectStore = db.transaction(defaultTable, "readonly").objectStore(defaultTable);
                objectStore.count().onsuccess = function (event) {
                    resolve(event.target.result === 0);
                };
            });
        },
        clear: async function () {
            await loadDB();

            return new Promise(function (resolve, reject) {
                let objectStore = db.transaction(defaultTable, "readwrite").objectStore(defaultTable);
                objectStore.clear().onsuccess = function () {
                    console.log("Clear transaction success");
                    resolve();
                }
            });
        }
    }
};