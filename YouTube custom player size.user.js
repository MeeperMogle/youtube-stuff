// ==UserScript==
// @name        YouTube custom player size
// @version     1.0
// @author      MeeperMogle
// @description Ability to manually set the exact size of video player
// @source      https://github.com/MeeperMogle/youtube-stuff
// @match       http*://www.youtube.com/watch*
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://code.jquery.com/jquery-3.1.1.min.js
// ==/UserScript==

function addChangePlayerSizeControls() {
    const fullVideoPlayerSelector = '#movie_player, #movie_player video';
    let playerWidth;
    let playerHeight;
    let savedCustomSize = GM_getValue('youtubeCustomPlayerSize');

    if (!savedCustomSize) {
        playerWidth = $(fullVideoPlayerSelector).css('width').replace('px', '');
        playerHeight = $(fullVideoPlayerSelector).css('height').replace('px', '');
        savedCustomSize = playerWidth + ':' + playerHeight;
        GM_setValue('youtubeCustomPlayerSize', savedCustomSize);
    } else {
        playerWidth = savedCustomSize.split(':')[0];
        playerHeight = savedCustomSize.split(':')[1];
    }

    $('#eow-title').parent().parent().append('<span id=resizeControlsSpan><br>Resize video! Auto? <input type=checkbox id=autoUpdateSize> ' +
        '<input type=text id=customPlayerWidth size=3 value="' + playerWidth + '"> x <input type=text size=3 id=customPlayerHeight value="' + playerHeight + '"> px' +
        ' <input type=submit id=customSizeSaveButton value="Save"></span>');
    $('#resizeControlsSpan *').css('display', 'inline');
    $('#customSizeSaveButton').hide();

    function updateSize() {
        $(fullVideoPlayerSelector).css('width', $('#customPlayerWidth').val() + 'px');
        $(fullVideoPlayerSelector).css('height', $('#customPlayerHeight').val() + 'px');
        $(fullVideoPlayerSelector).css('left', '0px');
        $('video').css("width", "100%").css("height", "100%");
    }

    setTimeout(function () {
        updateSize();
    }, 1500);

    $('#customPlayerWidth, #customPlayerHeight').keyup(function () {
        if ($('#autoUpdateSize').is(':checked')) {
            updateSize();
        }

        if ($('#customPlayerWidth').val() + ':' + $('#customPlayerHeight').val() !== savedCustomSize) {
            $('#customSizeSaveButton').show();
        } else {
            $('#customSizeSaveButton').hide();
        }
    });

    $('#customSizeSaveButton').click(function () {
        updateSize();

        savedCustomSize = $('#customPlayerWidth').val() + ':' + $('#customPlayerHeight').val();
        GM_setValue('youtubeCustomPlayerSize', savedCustomSize);

        $(this).hide();
    });
}

addChangePlayerSizeControls();
