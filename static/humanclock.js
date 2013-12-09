var s;
HumanClock = {

    settings: {
        images: [],
        imageSize: 150,
        socket: io.connect('http://human-clock.herokuapp.com'),
        numRows: 2,
        cutOffPoint: 11,
        $clockface: $('#clock-face'),
        $firstChild: null
    },

    feed: new Instafeed({
        get: 'tagged',
        tagName: 'overbeingunder',
        clientId: 'e967a7f0ff224a6090138cb72b730f3d',
        limit: '50',
        links: 'false',
        sortBy: 'most-recent',
        mock: 'true',
        resolution: 'standard_resolution',
        success: function(object) {
            var images = s.images;
            data = null;
            var data = object.data;
            for (var obj in data) {
                HumanClock.settings.images.push(data[obj].images.thumbnail);
            }
            var feedTimer = $.timer(function() {
                if (typeof images[0] != 'undefined') {
                    HumanClock.renderImages(images[0]);
                }
                images.shift();
            });
            feedTimer.set({
                time: 1000,
                autostart: true
            });
        }
    }),

    renderImages: function(image) {
        s.$firstChild.prepend('<img src="' + image.url + '" height="' + image.height + '" width="' + image.width + '">');

        $('.row').each(function(index) {
            $this = $(this);
            var rowLength = $this.children().length;
            if (rowLength >= s.cutOffPoint) {
                $this.trigger("fullRow");
            }
        });
    },

    attachEvent: function(el) {
        el.on("fullRow", {
            el: el
        }, function(e) {
            var el = $(e.data.el);
            var feedLength = el.children().length;
            var image = el.children().get(feedLength - 1);
            image.remove();
            if (el.is(':last-child')) {
                image = null;

            } else {
                el.next().prepend(image);
            }
        });
    },

    setupSocket: function() {
        socket.on('instagram', function(data) {
            console.log("receiving socket data");

            if ($('img[data-id=' + data.id + "]").length === 0) {
                var img = $("<img />").attr('src', data.image).attr('data-id', data.id)
                    .load(function() {
                        if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                            console.log('broken image!');
                        } else {
                            $('.row').each(function(index) {
                                $this = $(this);
                                var rowLength = $this.children().length;
                                if (rowLength >= s.cutOffPoint) {
                                    $this.trigger("fullRow");
                                }
                            });
                        }
                    });


            } else {
                console.log("ignore, duplicate.")
            }
        });
    },

    init: function() {
        s = this.settings;

        // Create all the rows and attach listener to check if they're full.
        for (var i = 0; i < s.numRows; i++) {
            var $el = $("<div class='row'></div>");
            s.$clockface.append($el);
            HumanClock.attachEvent($el);
        }
        s.$firstChild = $(s.$clockface.children()[0]);
        setupSocket();
    }

}

$(document).ready(function() {
    HumanClock.init();
});
