// ==UserScript==
// @name        YouTube playlist total time counter
// @version     1.0
// @author      MeeperMogle
// @description Displays the total time of a playlist when visiting the playlist page
// @source      https://github.com/MeeperMogle/youtube-stuff
// @match       http*://www.youtube.com/playlist?*
// @match       http*://www.youtube.com/course?*
// @grant       none
// @require     https://code.jquery.com/jquery-3.1.1.min.js
// ==/UserScript==

function viewCountOnPlaylist() {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    $('div.timestamp span').each(function () {
        let time = $(this).html();
        let separators = time.match(/:/g).length;

        if (separators === 0) {
            seconds += parseInt(time);
        } else if (separators == 1) {
            minutes += parseInt(time.split(":")[0]);
            seconds += parseInt(time.split(":")[1]);
        } else if (separators == 2) {
            hours += parseInt(time.split(":")[0]);
            minutes += parseInt(time.split(":")[1]);
            seconds += parseInt(time.split(":")[2]);
        } else {

        }
    });

    while (seconds >= 60) {
        seconds -= 60;
        minutes++;
    }
    while (minutes >= 60) {
        minutes -= 60;
        hours++;
    }

    if ($('.pl-header-details').eq(0).html().indexOf("totalTime") == -1) {
        $('.pl-header-details').eq(0).append("<span id=totalTime></span>");
    }

    $('#totalTime').html("<li>Total time " + hours + ":" + minutes + ":" + seconds + "</li>");

    $('button.browse-items-load-more-button').click(function () {
        setTimeout(function () {
            viewCountOnPlaylist();
        }, 3000);
    });
}
viewCountOnPlaylist();
