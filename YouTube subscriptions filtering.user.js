// ==UserScript==
// @name        YouTube subscriptions filtering
// @version     1.1
// @author      MeeperMogle
// @description Ability to filter videos on the (Grid) Subscriptions page of YouTube.
// @source      https://github.com/MeeperMogle/youtube-subscriptions-filtering
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
    } catch(e) {}
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

$('#guide-channels').prepend('Video filtering; all channels <span id=export title=Export>[&gt;</span> <span id=import title=Import>[&lt;</span><br><textarea id=filterAllChannels style="width:97%;">'+videoFiltering.all.join('\n')+'</textarea>' +
                             '<span id=stringifiedArea style="display:none;"><br>Cut this text out<br><textarea id=stringifiedSettings></textarea></span>' +
                             '<br>Hide watched <input type=checkbox id=hideWatched>' +
                             '<br><br>Per-channel filters <input type=checkbox id=showPerChannel>');

$('#export, #import').css('cursor', 'pointer');

$('#export').click(function(){
    $('#stringifiedArea').show();
    $('#stringifiedSettings').val(JSON.stringify(videoFiltering));
    $('#stringifiedSettings').keyup(function(){
        if ($(this).val() === '') {
            $('#stringifiedArea').hide();
        }
    });
});
$('#import').click(function(){
    const importSettings = prompt('Paste settings, then refresh the page');
    const oldSettings = videoFiltering;

    try {
        videoFiltering = JSON.parse(importSettings);
    } catch(e) {
        alert('Error occurred; keeping original settings...\n' + e);
        videoFiltering = oldSettings;
    }
});


// Update global settings on writing
$('#filterAllChannels').keyup(function() {
    videoFiltering.all = $(this).val().split('\n').filter(s => s.length > 0).sort();
});

$('#showPerChannel').prop('checked', videoFiltering.perChannelActivated);
$('#hideWatched').prop('checked', videoFiltering.hideWatched);

// Load subscribed channels from left sidebar
$('.guide-sort-container').hide();
$('#guide-channels .guide-channel').each(function() {
    // Store by ID
    const id = $(this).attr('id').replace('-guide-item', '');

    // Filter name
    // Note: What happens on a change...?
    const user = $(this).find('.display-name span').text().replace(/(  +|\n)/g, '');

    if (!videoFiltering.channel[id]) {
        videoFiltering.channel[id] = {
            name: user,
            filters: [],
        };
    }

    $(this).append('<span class=perChannelArea><textarea class=filterList id="filterList_'+id+'">'+videoFiltering.channel[id].filters.join('\n')+'</textarea></span>');
    $(this).css('margin-top', '10px');
    $(this).css('max-height', '100px');

    // Update current channel settings on writing
    $('#filterList_'+id).keyup(function() {
        videoFiltering.channel[id].filters = $(this).val().split('\n').filter(s => s.length > 0).sort();
    });
});

$('.filterList').keyup(function() {

});

$('#showPerChannel').click(function() {
    videoFiltering.perChannelActivated = !videoFiltering.perChannelActivated;
    $('.perChannelArea').css('display', videoFiltering.perChannelActivated ? 'block' : 'none');
});
$('#hideWatched').click(function() {
    videoFiltering.hideWatched = !videoFiltering.hideWatched;
});

$('.perChannelArea').css('display', videoFiltering.perChannelActivated ? 'block' : 'none');

window.onbeforeunload = function() {
    // Save current state of the filter settings
    saveSettings();
};

function applyFiltering() {
    // Remove watched videos
    if (videoFiltering.hideWatched) {
        $('.resume-playback-background').each(function() {
            findParentElement($(this), 'div.yt-lockup-video').parent().remove();
        });
    }

    // Remove all that has title matched by all-channels-filters
    videoFiltering.all.forEach(word => {
        const re = new RegExp(word, 'i');

        $('h3.yt-lockup-title a').each(function() {
            if ($(this).text().match(re) !== null) {
                findParentElement($(this), 'div.yt-lockup-video').parent().remove();
            }
        });
    });

    if (videoFiltering.perChannelActivated) {
        // Remove all that has a title matched by specific-channel-filters
        Object.keys(videoFiltering.channel).forEach(channelId => {
            const channel = videoFiltering.channel[channelId];
            channel.filters.forEach(word => {
                const re = new RegExp(word, 'i');

                $('.yt-lockup-byline:contains('+channel.name+')').each(function() {
                    $(this).parent().find('h3.yt-lockup-title a').each(function() {
                        if ($(this).text().match(re) !== null) {
                            findParentElement($(this), 'div.yt-lockup-video').parent().remove();
                        }
                    });
                });
            });
        });
    }
    $('.load-more-button').click(function() {
        setTimeout(applyFiltering, 1500);
    });

    // For the List view, remove uploader-rows that are now empty
    // Skip the first one, as there are settings placed there for some reason
    $('#browse-items-primary > ol > li:gt(0)').each(function() {
        if ($(this).find('div.yt-lockup-video').length === 0) {
            $(this).remove();
        }
    });

    // For the first one, just remove the name if it's empty
    $('#browse-items-primary > ol > li:eq(0)').each(function() {
        if ($(this).find('div.yt-lockup-video').length === 0) {
            $(this).find('h2').remove();
        }
    });
}

setTimeout(applyFiltering, 1000);
