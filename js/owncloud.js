/* global bookmarkApp */

if (!localStorage.getItem('ocurl')) {
    window.location.assign("options.html");
} else {
    init = function(){
        bookmarkApp.connectdb(1);
        document.getElementById('logout').onclick = function(){
            bookmarkApp.populateStorage();
            window.location.assign("options.html");
        };
        document.getElementById('ocrefresh').onclick = function(){
            bookmarkApp.refresh();
        };
        document.getElementById('search').addEventListener('submit', bookmarkApp.search);
    };
    window.addEventListener('load', init);
}