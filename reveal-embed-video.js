'use strict';


(function() {
    function stopVideo(video) {
        video.removeAttribute("src");
        video.className = "blank";
        video.load();
    }

    function startVideo(newClass, video, videoStream) {
        video.src = videoStream;
        video.className = newClass;
        video.play();
    }

    function slideChanged(previous, current, video, stream) {
        var oldVideoClass = previous && previous.getAttribute("data-video");
        var newVideoClass = current.getAttribute("data-video");

        if (oldVideoClass && !newVideoClass) {
            stopVideo(video);
        }

        if (newVideoClass) {
            startVideo(newVideoClass, video, stream);
        }
    }
    
    function setup(stream) {
        var video = document.createElement("video");
        var top   = document.getElementsByClassName("reveal");

        stopVideo(video);
        top[0].appendChild(video);


        Reveal.addEventListener('slidechanged', function(event){
            slideChanged(event.previousSlide,
                         event.currentSlide,
                         video,
                         stream);
        });

        var current = Reveal.getCurrentSlide();
        slideChanged(false, current, video, stream);
    }


    function linkIntoReveal(stream) {
        if (Reveal.isReady()) {
            setup(stream);
        }
        else {
            Reveal.addEventListener('ready', function(){
                setup(stream);
            });
        }
    }


    navigator.getUserMedia =
        navigator.getUserMedia       ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;

    var constraints = {
        audio: false,
        video: true
    };

    function gotStream(stream) {
        var videoStream = null;
        // window.stream = stream; // stream available to console
        if (window.URL) {
            videoStream = window.URL.createObjectURL(stream);
        } else {
            videoStream = stream;
        }
        linkIntoReveal(videoStream);
    }

    function mediaError(error) {
        console.log('navigator.getUserMedia error: ', error);
        throw(error);
    }

    navigator
        .mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)
        .catch(mediaError);

})();
