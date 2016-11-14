'use strict';


(function() {
    var config = Reveal.getConfig();
    var options = config["embed-video"] || {};
    options.path = options.path || scriptPath() || 'plugin/reveal-embed-video';

    var resource = document.createElement("link");
    resource.rel = "stylesheet";
    resource.href = options.path + "/reveal-embed-video.css";
    document.querySelector("head").appendChild(resource);

    var identifierClass = "live-video";

    function stopVideo(video) {
        video.removeAttribute("src");
        video.className = identifierClass + " blank";
        video.load();
    }

    function startVideo(newClass, video, videoStream) {
        if (video.src !== videoStream) {
            video.pause();
            video.src = videoStream;
        }
        video.className = identifierClass + ' ' + newClass;
        if (!video.playing) {
            video.play();
        }
    }

    function getVideoClass(element) {
        if (element instanceof Element) {
            var nodeVideoClass = element.getAttribute('data-video');
            if (!nodeVideoClass && document.evaluate) {
                nodeVideoClass = document.evaluate(
                  "string(ancestor::*/@data-video)", element, null, XPathResult.STRING_TYPE
                ).stringValue;
                element.setAttribute("data-video", nodeVideoClass || "blank");
            }
            return (nodeVideoClass && nodeVideoClass !== "blank") ? nodeVideoClass : false;
        }
        return false;
    }

    function slideChanged(previous, current, video, stream) {
        var oldVideoClass = getVideoClass(previous);
        var newVideoClass = getVideoClass(current);

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

    function scriptPath() {
        // obtain plugin path from the script element
        var path;
        var end = -("/reveal-embed-video.js".length);
        if (document.currentScript) {
            path = document.currentScript.src.slice(0, end);
        } else {
            var scriptTag = document.querySelector('script[src$="/reveal-embed-video.js"]');
            if (scriptTag) {
                path = sel.src.slice(0, end);
            }
        }
        return path;
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
