// GitHub Pages SPA fix for 404 redirects
(function() {
    var l = window.location;
    var basePath = '/Aihoghoghi/';
    if (l.pathname !== basePath && l.pathname !== basePath.slice(0, -1)) {
        var route = l.pathname.replace(basePath, '');
        var redirectUrl = l.protocol + '//' + l.hostname + basePath + '#/' + route;
        if (l.search) redirectUrl += l.search;
        l.replace(redirectUrl);
    } else {
        l.replace(basePath);
    }
})();