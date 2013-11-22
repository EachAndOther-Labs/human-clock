(function clock($){
    var images = [];
    var initial = true;
    var imageSize = 150;
    var numRows = Math.ceil(window.innerHeight/imageSize);
    var rowWidth = Math.ceil(window.innerWidth/imageSize);
    var cutOffPoint = 44;

    // TOKYO
    var tkyLat = '35.6895';
    var tkyLng = '139.6917';

    var feed = new Instafeed({
        get: 'tagged',
        tagName: 'newyork',
        clientId: 'e967a7f0ff224a6090138cb72b730f3d',
        limit: '50',
        links: 'false',
        sortBy: 'most-recent',
        mock: 'true',
        success: function(object){
            data = null;
            var data = object.data;
            for(var obj in data){
                images.push(data[obj].images.thumbnail);
            }
            if(initial){
                lumpIntoDOM(images);
                var feedTimer = $.timer(function(){
                    var feed = $("#instafeed");
                    var image = images[0];
                    if (typeof image !== 'undefined') {
                        feed.prepend('<img src="' + image.url + '" height="' + image.height + '" width="' + image.width + '">');
                        images.shift();
                    }
                    var feedLength = feed.children().length;
                    if(feedLength >= cutOffPoint){
                        feed.children().get(feedLength-1).remove();
                    }
                });
                feedTimer.set({time:5000,autostart:true});
                initial = false;
            }
        }

    });

    var lumpIntoDOM = function (images){
        $.each(images, function(i, image){
            $('#instafeed').prepend('<img src="' + image.url + '" height="' + image.height + '" width="' + image.width + '">');
        });
	// console.log(numRows);
	// for(var i = 0; i < numRows; i++){
	// 	$('#instafeed').append('<div id="' + i + '"></div>');
	// }
    };


    var fetchTimer = $.timer(function() {
        feed.run();
    });


    $(document).ready( function(){
        feed.run();
        fetchTimer.set({time:250000,autostart:true});
    });

})(jQuery);


