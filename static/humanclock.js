var s;
HumanClock = {

    settings: {
        images: [],
        imageSize: 150,
        socket: io.connect('http://human-clock.herokuapp.com'),
        numRows: 2,
        cutOffPoint: 11,
        $clockface: $('#clock-face'),
        $firstChild: null,
        $textBox: null
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
        s.socket.on('init', function(data) {
            console.log(data);
            s.$textbox.append("<p>" + data + "</p>");
        });
        s.socket.on('instagram', function(data) {
            console.log("receiving socket data");

            if ($('img[data-id=' + data.id + "]").length === 0) {
                var img = $("<img />").attr('src', data.image).attr('data-id', data.id)
                    .load(function() {
                        if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                            console.log('broken image!');
                        } else {
                            s.$firstChild.prepend(img);
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
        s.$textBox = $("<div class='textbox'></div>");
        s.$clockface.append(s.$textbox);
        s.$firstChild = $(s.$clockface.children()[0]);
        HumanClock.setupSocket();
    }

}

$(document).ready(function() {
    HumanClock.init();
});