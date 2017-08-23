'use strict';

(function() {

  var LiveStream = function(video, persistent) {
    this.__video = video;
    this.__stream = null;
    this.__status = LiveStream.STATUS_DISABLED;
    this.__persistent = persistent;
    this.__devices = null;
    this.__currentDeviceId = null;
  };

  LiveStream.STATUS_DISABLED = 0;
  LiveStream.STATUS_PENDING = 1;
  LiveStream.STATUS_ACTIVE = 2;
  LiveStream.STATUS_ERROR = -1;

  LiveStream.prototype.start = function() {
    if (this.__status === LiveStream.STATUS_DISABLED) {
      if (this.__stream) {
        this.__enable();
      } else {
        this.__create();
      }
    }
  };

  LiveStream.prototype.isActive = function() {
    return this.__status === LiveStream.STATUS_ACTIVE;
  };

  LiveStream.prototype.stop = function() {
    if (this.__status === LiveStream.STATUS_ACTIVE) {
      this.__destroy();
    }
  };

  LiveStream.prototype.next = function() {
    var deviceId;
    if (
        this.__devices instanceof Array &&
        this.__devices.length > 1
    ) {
      deviceId = this.__devices[0];
      if (this.__currentDeviceId) {
        var index = this.__devices.indexOf(this.__currentDeviceId);
        if (index >= 0 && index + 1 < this.__devices.length) {
          deviceId = this.__devices[index + 1];
        }
      }
    }
    if (deviceId && deviceId !== this.__currentDeviceId) {
      this.__currentDeviceId = deviceId;
      if (this.__stream) {
        this.__stream.getTracks().forEach(
            function(track) { track.stop(); }
        );
        this.__stream = null;
      }
      if (this.isActive()) {
        this.__create();
      }
    }
  };

  LiveStream.prototype.__enable = function() {
    if (!Reveal.isReady()) {
      Reveal.addEventListener(
          'ready',
          this.__enable().bind(this)
      );
    } else if (this.__stream) {
      var video = this.__video;
      if (video.srcObject !== this.__stream) {
        video.pause();
        video.srcObject = this.__stream;
      }
      video.setAttribute('data-enabled', 'true');
      if (!video.playing) {
        video.play();
      }
      this.__status = LiveStream.STATUS_ACTIVE;
    }
  };

  LiveStream.prototype.__create = function() {
    var constraints = {
      audio: false,
      video: true
    };
    this.__status = LiveStream.STATUS_PENDING;
    if (null === this.__devices) {
      this.__devices = [];
      navigator
          .mediaDevices
          .enumerateDevices()
          .then(
              function(devices) {
                for (var i = 0, c = devices.length; i < c; i++) {
                  if (devices[i].kind.toLowerCase() === 'videoinput') {
                    this.__devices.push(devices[i].deviceId);
                  }
                }
              }.bind(this)
          );
    }
    if (this.__currentDeviceId) {
      constraints.video = { deviceId: this.__currentDeviceId };
    }
    navigator
        .mediaDevices
        .getUserMedia(constraints)
        .then(
            function(stream) {
              this.__stream = stream;
              this.__currentDeviceId = stream.getVideoTracks()[0].getSettings().deviceId;
              this.__enable();
            }.bind(this)
        )
        .catch(
            function() {
              console.log('getUserMedia error: ', error);
              this.__status = LiveStream.STATUS_ERROR;
            }.bind(this)
        );
  };

  LiveStream.prototype.__destroy = function() {
    var video = this.__video;
    if (video instanceof HTMLVideoElement) {
      if (video.playing) {
        video.pause();
      }
      video.srcObject = null;
      video.removeAttribute('data-enabled');
      video.load();
      if (this.__stream && !this.__persistent) {
        this.__stream.getTracks().forEach(
            function(track) { track.stop(); }
        );
        this.__stream = null;
      }
    }
    this.__status = LiveStream.STATUS_DISABLED;
  };

  var LiveVideo = function(options) {
    this.__enabled = options.enabled;
    this.__registered = options.__registered;
    var resource = document.createElement('link');
    resource.rel = 'stylesheet';
    resource.href = options.path + '/reveal-embed-video.css';
    document.querySelector('head').appendChild(resource);
    this.__identfierClass = 'live-video';
    this.__video = document.querySelector('.reveal').appendChild(
        document.createElement('video')
    );
    this.__video.setAttribute('class', this.__identfierClass);
    this.__video.addEventListener(
        'click',
        function() {
          this.__stream.next();
        }.bind(this)
    );
    this.__stream = new LiveStream(this.__video, options.persistent);
    Reveal.addEventListener('ready', this.update.bind(this));
    Reveal.addEventListener('slidechanged', this.update.bind(this));
  };

  LiveVideo.prototype.toggle = function() {
    this.__enabled = !this.__enabled;
    this.update();
  };

  LiveVideo.prototype.update = function() {
    if (!this.__registered) {
      this.__registered = true;
      Reveal.registerKeyboardShortcut('C', 'Toggle speaker camera');
      Reveal.configure(
          {
            keyboard: {
              67: this.toggle.bind(this)
            }
          }
      );
    }
    var newVideoClass = this.getVideoClass(Reveal.getCurrentSlide());
    var enabled = this.__enabled && newVideoClass;
    if (this.__stream.isActive() && !enabled) {
      this.__video.setAttribute('class', this.__identfierClass);
      this.__stream.stop();
    }
    if (enabled) {
      this.__video.setAttribute('class', this.__identfierClass + ' ' + newVideoClass);
      this.__stream.start();
    }
  };

  LiveVideo.prototype.getVideoClass = function(element) {
    if (element instanceof Element) {
      var nodeVideoClass = element.getAttribute('data-video');
      if (!nodeVideoClass && document.evaluate) {
        nodeVideoClass = document.evaluate(
            'string(ancestor::*/@data-video)',
            element,
            null,
            XPathResult.STRING_TYPE,
            null
        ).stringValue;
        element.setAttribute('data-video', nodeVideoClass || 'false');
      }
      return (
          nodeVideoClass &&
          nodeVideoClass !== 'false' &&
          nodeVideoClass !== 'blank'
      ) ? nodeVideoClass : false;
    }
    return false;
  };

  var scriptPath = function() {
    // obtain plugin path from the script element
    var path;
    var end = -('/reveal-embed-video.js'.length);
    if (document.currentScript) {
      path = document.currentScript.src.slice(0, end);
    } else {
      var scriptTag = document.querySelector('script[src$="/reveal-embed-video.js"]');
      if (scriptTag) {
        path = scriptTag.src.slice(0, end);
      }
    }
    return path;
  };

  var config = Reveal.getConfig();
  var options = config['embed-video'] || {};
  options.enabled = !!options.enabled; // enable live video (toggle with [C])
  options.persistent = !!options.persistent; // keep camera active if hidden
  options.path = options.path || scriptPath() || 'plugin/reveal-embed-video';

  new LiveVideo(options);

})();
