var s;
HumanClock = {

    settings: {
        images: [],
        imageSize: 150,
        socket: io.connect('http://human-clock.herokuapp.com'),
        numRows: 5,
        cutOffPoint: 6,
        $clockface: $('#clock-face'),
        $firstChild: [],
        $time: [],
        $textBox: null,
        URL: document.URL,
        params: {}
    },

    attachEvent: function(el) {
        el.on("fullRow", {
            el: el
        }, function(e) {
            var $el = $(e.data.el);
            var feedLength = el.children().length;
            var image = $el.children().get(feedLength - 1);
            $(image).remove();
            if (el.is(':last-child')) {
                image = null;

            } else {
                el.next().prepend(image);
            }
        });
    },

    setupSocket: function() {
        s.socket.on(s.params.tag, function(data) {
            //console.log("receiving socket data");
            s.images.push({
                id: data.id,
                image: data.image
            });
        });
        setInterval(HumanClock.render, 1000);
    },

    socket: function() {
        s.socket.on(s.params.tag, function(data) {
            if ($('img[data-id="' + data.id + '"]').length === 0) {
                var img = $("<img />").attr('src', data.image).attr('data-id', data.id).attr('width', 150).attr('height', 150)
                    .load(function() {
                        if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                            //console.log('broken image!');
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
                console.log("ignore, duplicate.");
            }
        });
    },

    render: function() {
        if (s.images.length > 0) {
            var item = s.images[0];
            console.log(item.id);
            if ($('img[data-id="' + item.id + '"]').length === 0) {
                var img = $("<img />").attr('src', item.image).attr('data-id', item.id).attr('width', 150).attr('height', 150)
                    .load(function() {
                        if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                            //console.log('broken image!');
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
                        s.images.shift();
                    });
            } else {
                console.log("ignore, duplicate.");
            }
        }
    },

    updateTime: function() {
        s.$time.html(moment(new Date()).zone(s.params.timeDiff).format("H:mm"));
    },

    init: function() {
        s = this.settings;
        var url = s.URL + "/params";
        $.getJSON(url, function(data) {
            s.params = data;

            // Create all the rows and attach listener to check if they're full.
            for (var i = 0; i < s.numRows; i++) {
                var $el = $("<div class='row'></div>");
                s.$clockface.prepend($el);
                HumanClock.attachEvent($el);
            }
            $("body").prepend("<div class='textbox'></div>");
            s.$textBox = $(".textbox");

            s.$firstChild = $(s.$clockface.children()[0]);

            s.$textBox.append('<p><span class="tag">' + s.params.tag + '</span><span class="time"></span></p>');
            s.$time = $('.time');
            HumanClock.updateTime();
            setInterval(HumanClock.updateTime, 1000);
            HumanClock.setupSocket();
        });


    }

};

$(document).ready(function() {
    HumanClock.init();
});
