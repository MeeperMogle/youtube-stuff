// ==UserScript==
// @name        YouTube subscriptions filtering
// @version     1.3
// @author      MeeperMogle
// @description Ability to filter videos on the (Grid) Subscriptions page of YouTube.
// @source      https://github.com/MeeperMogle/youtube-stuff
// @match       http*://www.youtube.com/feed/subscriptions*
// @grant       GM_setValue
// @grant       GM_getValue
// @require     https://code.jquery.com/jquery-3.1.1.min.js
// @noframes
// ==/UserScript==

// Turn off first auto-Load More on scrolldown
$('button.yt-uix-load-more').removeAttr('data-scrolldetect-callback');

const storageString = "YouTubeSubFilteringV1.0Storage";
let videoFiltering;

function saveSettings() {
    GM_setValue(storageString, JSON.stringify(videoFiltering));
}

function loadSettings() {
    // Avoid crash on value unset
    try {
        videoFiltering = JSON.parse(GM_getValue(storageString));
    } catch (e) {}
}

loadSettings();

if (!videoFiltering) {
    console.log("No local settings found, setting defaults...");
    videoFiltering = {
        all: ['crencast', 'zelda'],
        channel: {
            'UC_ufxdQbKBrrMOiZ4LzrUyA': {
                name: 'PressHeartToContinue',
                filters: ['anime', 'anime newz'],
            },
        },
        hideWatched: true,
        perChannelActivated: true,
    };

    saveSettings();
}

// Recursively find (and return) the first parent that matches the given selector
// Note: Requires jQuery.parent()
function findParentElement(element, targetSelector) {
    return element.is(targetSelector) ? element : findParentElement(element.parent(), targetSelector);
}

const baseControlsInterval = setInterval(function() {
    try {
        document.getElementsByClassName('ytd-guide-subscriptions-section-renderer')[0].innerHTML +=
            'Video filtering; all channels <span id=export title=Export>[&gt;</span> <span id=import title=Import>[&lt;</span><br><textarea id=filterAllChannels style="width:97%;">' +
            videoFiltering.all.join('\n') + '</textarea>' +
            '<span id=stringifiedArea style="display:none;"><br>Cut this text out<br><textarea id=stringifiedSettings></textarea></span>' +
            '<br>Hide watched <input type=checkbox id=hideWatched>' +
            '<br><br>Per-channel filters <input type=checkbox id=showPerChannel>';


        $('#export, #import').css('cursor', 'pointer');

        $('#export').click(function () {
            $('#stringifiedArea').show();
            $('#stringifiedSettings').val(JSON.stringify(videoFiltering));
            $('#stringifiedSettings').keyup(function () {
                if ($(this).val() === '') {
                    $('#stringifiedArea').hide();
                }
            });
        });
        $('#import').click(function () {
            const importSettings = prompt('Paste settings, then refresh the page');
            const oldSettings = videoFiltering;

            try {
                videoFiltering = JSON.parse(importSettings);
            } catch (e) {
                alert('Error occurred; keeping original settings...\n' + e);
                videoFiltering = oldSettings;
            }
        });


        // Update global settings on writing
        $('#filterAllChannels').keyup(function () {
            videoFiltering.all = $(this).val().split('\n').filter(s => s.length > 0).sort();
        });

        $('#showPerChannel').prop('checked', videoFiltering.perChannelActivated);
        $('#hideWatched').prop('checked', videoFiltering.hideWatched);

        clearInterval(baseControlsInterval);


    } catch (e) {

    }

    // Load subscribed channels from left sidebar
    document.querySelectorAll('.ytd-guide-subscriptions-section-renderer #endpoint').forEach(function (el) {
        return;
        console.log($(el));
        // Store by ID
        const id = el.id.replace('-guide-item', '');
        console.log(id);

        // Filter name
        // Note: What happens on a change...?
        const user = $(el).find('.display-name span').text().replace(/(  +|\n)/g, '');

        if (!videoFiltering.channel[id]) {
            videoFiltering.channel[id] = {
                name: user,
                filters: [],
            };
        }

        $(el).append('<span class=perChannelArea><textarea class=filterList id="filterList_' + id + '">' + videoFiltering.channel[id].filters.join('\n') + '</textarea></span>');
        $(el).css('margin-top', '10px');
        $(el).css('max-height', '100px');

        // Update current channel settings on writing
        $('#filterList_' + id).keyup(function () {
            videoFiltering.channel[id].filters = $(el).val().split('\n').filter(s => s.length > 0).sort();
        });
    });

    $('#showPerChannel').click(function () {
        videoFiltering.perChannelActivated = !videoFiltering.perChannelActivated;
        $('.perChannelArea').css('display', videoFiltering.perChannelActivated ? 'block' : 'none');
    });
    $('#hideWatched').click(function () {
        videoFiltering.hideWatched = !videoFiltering.hideWatched;
    });

    $('.perChannelArea').css('display', videoFiltering.perChannelActivated ? 'block' : 'none');

    window.onbeforeunload = function () {
        // Save current state of the filter settings
        saveSettings();
    };
    $(window).bind('beforeunload', function(){
        // Save current state of the filter settings
        saveSettings();
    });
}, 1500);

function applyFiltering() {
    // Remove watched videos
    if (videoFiltering.hideWatched) {
        console.group("Hide watched...");
        document.querySelectorAll('#progress').forEach(function (el) {
            let parentElement = findParentElement($(el), 'ytd-grid-video-renderer.ytd-grid-renderer');
            console.log(parentElement.text().replace(/  +|\n|\d\d?:\d?\d|Watch later|WATCHED|\d[^ ]+ views.+|Verified/g, ""));
            parentElement.remove();
        });
        console.groupEnd();
    }

    // Remove all that has title matched by all-channels-filters
    console.group("Hide global...");
    videoFiltering.all.forEach(word => {
        const re = new RegExp(word, 'i');

        document.querySelectorAll('#video-title').forEach(function (el) {
            if ($(el).text().match(re) !== null) {
                console.log($(el).text() + "[" + word + "]");
                findParentElement($(el), 'ytd-grid-video-renderer.ytd-grid-renderer').remove();
            }
        });
    });
    console.groupEnd();

    if (false && videoFiltering.perChannelActivated) {
        // Remove all that has a title matched by specific-channel-filters
        Object.keys(videoFiltering.channel).forEach(channelId => {
            const channel = videoFiltering.channel[channelId];

            channel.filters.forEach(word => {
                const re = new RegExp(word, 'i');

                document.querySelectorAll('#byline a').forEach(function (el) {
                    findParentElement($(el), '#meta').find('#video-title').each(function () {
                        if ($(el).text().match(re) !== null) {
                            console.log($(el).text());
                            findParentElement($(el), 'ytd-grid-video-renderer.ytd-grid-renderer').remove();
                        }
                    });
                });
            });
        });
    }
    $('.load-more-button').click(function () {
        setTimeout(applyFiltering, 1500);
    });

    // For the List view, remove uploader-rows that are now empty
    // Skip the first one, as there are settings placed there for some reason
    $('#browse-items-primary > ol > li:gt(0)').each(function () {
        if ($(this).find('div.yt-lockup-video').length === 0) {
            $(this).remove();
        }
    });

    // For the first one, just remove the name if it's empty
    $('#browse-items-primary > ol > li:eq(0)').each(function () {
        if ($(this).find('div.yt-lockup-video').length === 0) {
            $(this).find('h2').remove();
        }
    });
}

setInterval(applyFiltering, 1000);
//setTimeout(applyFiltering, 10000);
