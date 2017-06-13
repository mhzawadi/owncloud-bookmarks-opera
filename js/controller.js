/* global IDBKeyRange, indexedDB */

var bookmarkApp = {
    settings_page: "options.html",
    ocurl: "",
    ocusername: "",
    ocpassword: "",
    next_check: "",
    dbobject: "",
    idb: "",
    show_list: 0,
    tags: '',
    connectdb: function (show_list) {
        'use strict';
        this.show_list = show_list;
        this.idb = indexedDB.open('OCBookmarks', 2);
        this.idb.onupgradeneeded = function (evt) {
            var tags;
            bookmarkApp.dbobject = evt.target.result;
            if (evt.oldVersion < 1) {
                bookmarkApp.dbobject.createObjectStore('bookmarks', {autoIncrement: true});
                tags = bookmarkApp.dbobject.createObjectStore('tags', {keyPath: "name"});
                bookmarkApp.next_check = 0;
                bookmarkApp.saveCredentials;
            }
        };
        this.idb.onsuccess = function (evt) {
            bookmarkApp.dbobject = evt.target.result;
            if (bookmarkApp.show_list === 1) {
                bookmarkApp.PollFromOC();
            }
            //console.log("success: "+ bookmarkApp.dbobject);
        };
        this.idb.onerror = function (e) {
            console.log("error: ", e);
        };
    },
    clearDB: function () {
        indexedDB.deleteDatabase('OCBookmarks');
        indexedDB.deleteDatabase('IDBBookmarks');
    },
    populateStorage: function () {
        localStorage.setItem('ocurl', '');
        localStorage.setItem('username', '');
        localStorage.setItem('password', '');
        localStorage.setItem('next_check', '');

        this.loadCredentials();
    },
    loadCredentials: function () {
        this.ocurl = localStorage.getItem('ocurl');
        this.ocusername = localStorage.getItem('username');
        this.ocpassword = localStorage.getItem('password');
        this.next_check = localStorage.getItem('next_check');
    },
    saveCredentials: function () {
        localStorage.setItem('ocurl', this.ocurl);
        localStorage.setItem('username', this.ocusername);
        localStorage.setItem('password', this.ocpassword);
        localStorage.setItem('next_check', this.next_check);
    },
    saveBookmarkToCache: function (evt, index) {
        'use strict';
        //evt.preventDefault();
        var entry = {}, transaction, objectstore, request, fields = evt;

        // Build our task object.
        entry['url'] = fields.url;
        entry['title'] = fields.title;
        entry['description'] = fields.description;
        entry['tags'] = fields.tags;

        var x;
        for (x in entry['tags']) {
            var tag = entry['tags'][x];
            var tag_transaction, tag_objectstore, tag_request;
            tag_transaction = bookmarkApp.dbobject.transaction(['tags'], 'readwrite');
            tag_objectstore = tag_transaction.objectStore('tags');

            // Save the entry object
            tag_request = tag_objectstore.put({name: tag});

            tag_transaction.oncomplete = function (evt) {
                //console.log("added tag:" + tag);
            };
        }
        ;
        // Open a transaction for writing
        transaction = this.dbobject.transaction(['bookmarks'], 'readwrite');
        objectstore = transaction.objectStore('bookmarks');

        // Save the entry object
        request = objectstore.put(entry, index);

        transaction.oncomplete = function (evt) {
            console.log( entry.title + ' ' + entry.url );
        };

        //transaction.onerror = errorhandler;
    },
    PollFromOC: function () {
        this.loadCredentials();
        if (this.next_check < Date.now()) {
            document.getElementById("content-wrapper").innerHTML = '<div id="loading"><img class="svg" alt="" src="img/loading.gif"></div>';
            var bookmarks = fetch(localStorage.getItem('ocurl') + "/index.php/apps/bookmarks/public/rest/v2/bookmark?page=-1", {
                headers: {
                    Authorization: 'basic ' + btoa(localStorage.getItem('username') + ':' + localStorage.getItem('password'))
                }
            });
            bookmarks
                .then(response => {
                    if (response.status !== 200) return Promise.reject(new Error('Failed to retrieve bookmarks from ownCloud'))
                    else return response.json()
                })
                .then((json) => {
                    if ('success' !== json.status) return Promise.reject(json.data)
                    console.log(json)
                    return json.data
                })
                .then(json => {
                    for (i = 0; i < json.length; i++) {
                        bookmarkApp.saveBookmarkToCache(json[i], i);
                    }
                    localStorage.setItem('next_check', (Date.now() + 3600000));
                    bookmarkApp.displayCache();
                });
            /*var xmlhttp = new XMLHttpRequest();
            var auth = Base64.encode(localStorage.getItem('username') + ':' + localStorage.getItem('password'));
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    var myArr = JSON.parse(xmlhttp.responseText);
                    document.getElementById("content-wrapper").innerHTML = '';
                    var i;
                    for (i = 0; i < myArr.length; i++) {
                        bookmarkApp.saveBookmarkToCache(myArr[i], i);
                    }
                    localStorage.setItem('next_check', (Date.now() + 3600000));
                    bookmarkApp.displayCache();
                }
            };
            xmlhttp.open("GET", "" + localStorage.getItem('ocurl') + "/index.php/apps/bookmarks/public/rest/v2/bookmark?page=-1", true );
            xmlhttp.setRequestHeader('Authorization', "Basic " + auth);
            xmlhttp.withCredentials = "true";
            xmlhttp.send();*/
        } else {
            document.getElementById("content-wrapper").innerHTML = '<div id="loading"><img class="svg" alt="" src="img/loading.gif"></div>';
            document.getElementById("loading").className = 'content-inner-container';
            bookmarkApp.displayCache();
        }
    },
    displayCache: function () {
        'use strict';
        bookmarkApp.displayTags();
        var objectstore, index, request;
        objectstore = bookmarkApp.dbobject.transaction(['bookmarks'], 'readonly').objectStore('bookmarks');
        request = objectstore.openCursor(IDBKeyRange.lowerBound(0), 'next');
        document.getElementById("list").innerHTML = '';
        request.onsuccess = function () {
            var record, value;
            record = request.result;
            if (record) {
                value = record.value;
                var nodediv = document.createElement("DIV");
                nodediv.className = "bookmarklet";
                var nodea = document.createElement("A");
                var nodea_text = document.createTextNode(value.title);
                var nodep = document.createElement("P");
                var nodep_text = document.createTextNode(value.description);
                nodep.appendChild(nodep_text);
                nodea.href = value.url;
                nodea.target = "_blank";
                nodea.appendChild(nodea_text);
                nodediv.appendChild(nodea);
                var x;
                for (x in value.tags) {
                    var tag = value.tags[x];
                    index = x;
                    //$.each(value.tags, function (index, tag) {
                    if (tag !== "") {
                        var tag_span = document.createElement("SPAN");
                        var tag_span_txt = document.createTextNode(tag);
                        tag_span.appendChild(tag_span_txt);
                        tag_span.className = "bookmark_tag";
                        tag_span.addEventListener('click', bookmarkApp.search);
                        nodediv.appendChild(tag_span);
                    }
                    //});
                }
                nodediv.appendChild(nodep);
                document.getElementById("list").appendChild(nodediv);
                record.continue(); // advance to the next result
            }
        };
    },
    displayTags: function () {
        'use strict';
        var objectstore, request;
        objectstore = bookmarkApp.dbobject.transaction(['tags'], 'readonly').objectStore('tags');
        request = objectstore.openCursor(IDBKeyRange.lowerBound(0), 'next');
        document.getElementById("content-wrapper").innerHTML = '';
        var nodep = document.createElement("P");
        var list_div = document.createElement("DIV");
        //nodep.className = "bookmarklet";
        nodep.id = "tags";
        nodep.style = "height: 80px;overflow-y:scroll;";
        list_div.style = "height: 242px;overflow-y:scroll;";
        list_div.id = "list";
        request.onsuccess = function () {
            var record, value, tag_span_txt;
             document.getElementById("tags").className = "bookmarklet";
            record = request.result;
            if (record) {
                value = record.value.name;
                var tag_span = document.createElement("A");
                if (value === '') {
                    tag_span_txt = document.createTextNode("NONE");
                    tag_span.addEventListener('click', bookmarkApp.displayCache);
                } else {
                    tag_span_txt = document.createTextNode(value);
                    tag_span.addEventListener('click', bookmarkApp.search);
                }
                tag_span.appendChild(tag_span_txt);
                tag_span.className = "bookmark_tag";
                document.getElementById("tags").appendChild(tag_span);
                record.continue(); // advance to the next result
            }
        };
        document.getElementById("content-wrapper").appendChild(nodep);
        document.getElementById("content-wrapper").appendChild(list_div);
    },
    refresh: function () {
        this.loadCredentials();
        this.next_check = 0;
        this.saveCredentials();
        this.PollFromOC();
    },
    search: function (evt) {
        'use strict';
        bookmarkApp.displayTags();
        evt.preventDefault();
        var objectstore, request, search;
        objectstore = bookmarkApp.dbobject.transaction(['bookmarks'], 'readonly').objectStore('bookmarks');
        request = objectstore.openCursor(IDBKeyRange.lowerBound(0), 'next');
        document.getElementById("list").innerHTML = '';
        request.onsuccess = function (successevent) {
            var record, value, child;
            record = request.result;
            if (record) {
                value = record.value;
                if (evt.target.text === undefined) {
                    child = evt.target.children;
                    search = new RegExp(child[1].value);
                }else{
                    search = new RegExp(evt.target.text);
                }
                var t;
                for (t in value.tags) {
                    var tag = value.tags[t];
                    if (search.test(tag)) {
                        var nodediv = document.createElement("DIV");
                        nodediv.className = "bookmarklet";
                        var nodea = document.createElement("A");
                        var nodea_text = document.createTextNode(value.title);
                        nodea.href = value.url;
                        nodea.target = "_blank";
                        nodea.appendChild(nodea_text);
                        nodediv.appendChild(nodea);
                        var tt;
                        for (tt in value.tags) {
                            var tag = value.tags[tt];
                            if (tag !== "") {
                                var tag_span = document.createElement("A");
                                var tag_span_txt = document.createTextNode(tag);
                                tag_span.appendChild(tag_span_txt);
                                tag_span.className = "bookmark_tag";
                                tag_span.addEventListener('click', bookmarkApp.search);
                                nodediv.appendChild(tag_span);
                            }
                        }
                        var nodep = document.createElement("P");
                        var nodep_text = document.createTextNode(value.description);
                        nodep.appendChild(nodep_text);
                        nodediv.appendChild(nodep);
                        document.getElementById("list").appendChild(nodediv);
                    }
                }
                ;
                record.continue(); // advance to the next result
            }
        };
    }
};
