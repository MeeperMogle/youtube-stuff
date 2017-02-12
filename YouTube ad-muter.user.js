// ==UserScript==
// @name        YouTube ad-muter
// @version     0.1
// @author      MeeperMogle
// @description Mute YouTube video ads - but still let them run, to support the creator
// @source      https://github.com/MeeperMogle/youtube-ad-muter
// @match       http*://www.youtube.com/watch*
// @grant       none
// @require     https://code.jquery.com/jquery-3.1.1.min.js
// ==/UserScript==

let audioHasBeenManuallyChanged = false;

$('.ytp-mute-button, .ytp-volume-slider, .ytp-volume-slider-handle').mousedown(function() {
    audioHasBeenManuallyChanged = true;
});

let thereWasEverVideoAd = false;
let unMuted = false;

setInterval(function(){
    const player = document.getElementById('movie_player');
    if($('.videoAdUi').length > 0) {
        thereWasEverVideoAd = true;

        if (!audioHasBeenManuallyChanged) {
            player.mute();
            player.playVideo();
        }
    }
    // Not currently on a video ad
    else {
        // Not currently on a video ad, and never was
        if (!thereWasEverVideoAd) {
            // Do nothing
        }
        // Unmute and pause once the video ad is over
        else if (!unMuted){
            player.unMute();
            unMuted = true;
            player.pauseVideo();
        }
    }
}, 1000);