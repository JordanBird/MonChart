var GitHubPages = (function () {
    
    function normaliseUrls() {
        if (!window.location.origin.indexOf('.github.io')) {
            return;
        }

        $('a').each(function () {
            if ($(this).attr('href').startsWith('/')) {
                $(this).attr('href', window.location.origin + window.location.pathname + $(this).attr('href').replace(/^\/|\/$/g, ''));
            }
        });
    }

    return {
        normaliseUrls: normaliseUrls
    };
})();