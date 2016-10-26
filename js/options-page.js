/* global bookmarkApp */
//indexedDB.deleteDatabase('OCBookmarks');
//indexedDB.deleteDatabase('IDBBookmarks');

/*options*/
if(!localStorage.getItem('ocurl')) {
    bookmarkApp.populateStorage();
} else {
    bookmarkApp.loadCredentials();
    document.getElementById('ocurl').value = bookmarkApp.ocurl;
    document.getElementById('username').value = bookmarkApp.ocusername;
    document.getElementById('password').value = bookmarkApp.ocpassword;
    //document.getElementById('clear_db').onclick = bookmarkApp.clearDB();
}

init = function(){
    window.addEventListener('load', bookmarkApp.connectdb(0));
    document.getElementById('submit').onclick = function(){
        bookmarkApp.ocurl      = document.getElementById('ocurl').value;
        bookmarkApp.ocusername = document.getElementById('username').value;
        bookmarkApp.ocpassword = document.getElementById('password').value;

        bookmarkApp.saveCredentials();
        bookmarkApp.loadCredentials();
        document.getElementById('ocurl').value = bookmarkApp.ocurl;
        document.getElementById('username').value = bookmarkApp.ocusername;
        document.getElementById('password').value = bookmarkApp.ocpassword;
        document.getElementById("upd_txt").innerHTML = 'Settings Updated';
        document.getElementById("upd_txt").className = 'bookmark_tag';
    };
};
window.addEventListener('load', init);