/**
 * reveal-embed-video.js is a plugin to include an live video stream (from a webcam) in
 * reveal.js slides.
 *
 * @namespace EmbedVideo
 * @author Thomas Weinert
 * @license MIT
 * @see {@link http://thomas.weinert.info/reveal-embed-video/|GitHub} for documentation, bug reports and more.
 */

'use strict';

/**
 * Plugin initialization
 * @function
 */
(function () {

  /**
   * @param {HTMLVideoElement} video
   * @param {boolean} persistent Keep stream for disabled video
   * @constructor
   * @memberOf EmbedVideo
   */
  var LiveStream = function (video, persistent) {
    /**
     * @type {HTMLVideoElement}
     * @private
     */
    this._video = video;
    /**
     * @type {boolean}
     * @private
     */
    this._persistent = persistent;
    /**
     * @type {EmbedVideo.LiveStream.STATUS}
     * @private
     */
    this._status = LiveStream.STATUS.DISABLED;
    /**
     * @type {?(MediaStream|MediaSource|Blob|File)}
     * @private
     */
    this._stream = null;
    /**
     * @type {string[]}
     * @private
     */
    this._devices = null;
    /**
     * @type {?string}
     * @private
     */
    this._currentDeviceId = null;
  };

  /**
   * @typedef {number} EmbedVideo.LiveStream.STATUS
   */

  /**
   * @enum {EmbedVideo.LiveStream.STATUS}
   */
  LiveStream.STATUS = {
    DISABLED: 0,
    PENDING: 1,
    ACTIVE: 2,
    ERROR: -1
  };

  /**
   * Start streaming, activate an existing stream or create a new one.
   * If here is an active stream this call will do nothing.
   */
  LiveStream.prototype.start = function () {
    if (this._status === LiveStream.STATUS.DISABLED) {
      if (this._stream) {
        this._enable();
      } else {
        this._create();
      }
    }
  };

  /**
   * Check if the stream is active
   * @returns {boolean}
   */
  LiveStream.prototype.isActive = function () {
    return this._status === LiveStream.STATUS.ACTIVE;
  };

  /**
   * Stop video stream and disable video
   */
  LiveStream.prototype.stop = function () {
    if (this.isActive()) {
      this._disable();
    }
  };

  /**
   * Switch to the next video device
   */
  LiveStream.prototype.next = function () {
    var deviceId = null;
    if (
      this._devices instanceof Array &&
      this._devices.length > 1
    ) {
      deviceId = this._devices[0];
      if (this._currentDeviceId) {
        var index = this._devices.indexOf(this._currentDeviceId);
        if (index >= 0 && index + 1 < this._devices.length) {
          deviceId = this._devices[index + 1];
        }
      }
    }
    if (deviceId && deviceId !== this._currentDeviceId) {
      // noinspection JSUnusedGlobalSymbols
      this._currentDeviceId = deviceId;
      this._destroy();
      if (this.isActive()) {
        this._create();
      }
    }
  };

  /**
   * Activate video after Reveal is ready, wait with video activation until then
   * @private
   */
  LiveStream.prototype._enable = function () {
    var video;
    if (!Reveal.isReady()) {
      Reveal.addEventListener(
        'ready',
        /**
         * @this EmbedVideo.LiveStream
         */
        function () {
          this._enable()
        }.bind(this)
      );
    } else if (this._stream) {
      video = this._video;
      if (video.srcObject !== this._stream) {
        video.pause();
        video.srcObject = this._stream;
      }
      video.setAttribute('data-enabled', 'true');
      if (!video.playing) {
        video.play();
      }
      // noinspection JSUnusedGlobalSymbols
      this._status = LiveStream.STATUS.ACTIVE;
    }
  };

  /**
   * Fetch device list and create user media stream
   * @private
   */
  LiveStream.prototype._create = function () {
    var constraints = {
      audio: false,
      video: true
    };
    // noinspection JSUnusedGlobalSymbols
    this._status = LiveStream.STATUS.PENDING;
    if (null === this._devices) {
      // noinspection JSUnusedGlobalSymbols
      this._devices = [];
      navigator
        .mediaDevices
        .enumerateDevices()
        .then(
          /**
           * @param {Array.<MediaStream|MediaSource|Blob|File>} devices
           * @this EmbedVideo.LiveStream
           */
          function (devices) {
            for (var i = 0, c = devices.length; i < c; i++) {
              if (devices[i].kind.toLowerCase() === 'videoinput') {
                this._devices.push(devices[i].deviceId);
              }
            }
          }.bind(this)
        );
    }
    if (this._currentDeviceId) {
      constraints.video = {deviceId: this._currentDeviceId};
    }
    navigator
      .mediaDevices
      .getUserMedia(constraints)
      .then(
        /**
         * @this EmbedVideo.LiveStream
         */
        function (stream) {
          this._stream = stream;
          this._currentDeviceId = stream.getVideoTracks()[0].getSettings().deviceId;
          this._enable();
        }.bind(this)
      )
      .catch(
        /**
         * @this EmbedVideo.LiveStream
         */
        function (error) {
          console.log('getUserMedia error: ', error);
          this._status = LiveStream.STATUS.ERROR;
        }.bind(this)
      );
  };

  /**
   * Pause video, remove enabled status and stop stream
   * @private
   */
  LiveStream.prototype._disable = function () {
    var video = this._video;
    if (video instanceof HTMLVideoElement) {
      if (video.playing) {
        video.pause();
      }
      video.srcObject = null;
      video.removeAttribute('data-enabled');
      video.load();
      if (!this._persistent) {
        this._destroy();
      }
    }
    // noinspection JSUnusedGlobalSymbols
    this._status = LiveStream.STATUS.DISABLED;
  };

  /**
   * @private
   */
  LiveStream.prototype._destroy = function() {
    if (this._stream) {
      this._stream.getTracks().forEach(
        function (track) {
          track.stop();
        }
      );
      // noinspection JSUnusedGlobalSymbols
      this._stream = null;
    }
  };

  /**
   * @param {EmbedVideo.Plugin.Options} options
   * @constructor
   * @memberOf EmbedVideo
   */
  var Plugin = function (options) {
    var style;
    var _isEnabled = options.enabled;

    /**
     * is video the video display enabled
     * @returns {boolean}
     */
    this.isEnabled = function() {
      return _isEnabled;
    };

    /**
     * enabled/disable the video display
     * @method
     * @returns {boolean}
     */
    this.toggle = function() {
      _isEnabled = !_isEnabled;
      this.update();
      return _isEnabled;
    }.bind(this);

    /**
     * CSS class to identify the video element (avoid conflicts with other videos)
     * @type {string}
     * @private
     */
    this._identfierClass = 'live-video';
    /**
     * @type {HTMLVideoElement}
     * @private
     */
    this._video = document.querySelector('.reveal').appendChild(
      document.createElement('video')
    );
    this._video.setAttribute('class', this._identfierClass);
    this._video.addEventListener(
      'click',
      /**
       * @this EmbedVideo.Plugin
       */
      function () {
        this._stream.next();
      }.bind(this)
    );
    /**
     * @type {EmbedVideo.LiveStream}
     * @private
     */
    this._stream = new LiveStream(this._video, options.persistent);

    style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = options.path + '/reveal-embed-video.css';
    document.querySelector('head').appendChild(style);

    Reveal.addEventListener(
      'ready',
      /**
       * @this EmbedVideo.Plugin
       */
      function() {
        Reveal.registerKeyboardShortcut('C', 'Toggle speaker camera');
        Reveal.configure(
          {
            keyboard: {
              67: this.toggle.bind(this)
            }
          }
        );
      }.bind(this)
    );
    Reveal.addEventListener(
      'slidechanged',
      this.update.bind(this)
    );
  };

  /**
   * Update plugin status in DOM
   */
  Plugin.prototype.update = function () {
    var newVideoClass, enable;
    newVideoClass = this.getVideoClass(Reveal.getCurrentSlide());
    enable = this.isEnabled() && newVideoClass;
    if (this._stream.isActive() && !enable) {
      this._video.setAttribute('class', this._identfierClass);
      this._stream.stop();
    }
    if (enable) {
      this._video.setAttribute('class', this._identfierClass + ' ' + newVideoClass);
      this._stream.start();
    }
  };

  /**
   * Fetch the slide specific style class for the video element
   * from the `data-video` attribute.
   *
   * @param {HTMLElement} element
   * @returns {?string}
   */
  Plugin.prototype.getVideoClass = function (element) {
    if (element instanceof Element) {
      var nodeVideoClass = element.getAttribute('data-video');
      /**
       * @type {HTMLElement|ParentNode}
       */
      var node = element;
      do {
        nodeVideoClass = node.getAttribute('data-video');
        node = node.parentNode;
      } while (!nodeVideoClass && node);
      element.setAttribute('data-video', nodeVideoClass || 'false');
      return (
        nodeVideoClass &&
        nodeVideoClass !== 'false' &&
        nodeVideoClass !== 'blank'
      ) ? nodeVideoClass : null;
    }
    return null;
  };

  /**
   * obtain plugin path from the script element
   * @returns {string}
   * @memberOf EmbedVideo
   */
  var getScriptPath = function () {
    var path;
    var end = -('/reveal-embed-video.js'.length);
    if (document.currentScript && document.currentScript['src']) {
      path = document.currentScript['src'].slice(0, end);
    } else {
      var scriptTag = document.querySelector('script[src$="/reveal-embed-video.js"]');
      if (scriptTag) {
        path = scriptTag.src.slice(0, end);
      }
    }
    return path;
  };

  /**
   * @type {Object.<string, *>}
   */
  var config = Reveal.getConfig();

  /**
   * @typedef EmbedVideo.Plugin.Options
   * @property {boolean} enabled Enable the plugin on startup
   * @property {boolean} persistent Keep stream active on disable
   * @property {string} path Script path
   */

  /**
   * @type {EmbedVideo.Plugin.Options}
   */
  var options = config['embed-video'] || {};
  options.enabled = !!options.enabled; // enable live video (toggle with [C])
  options.persistent = !!options.persistent; // keep camera active if hidden
  options.path = options.path || getScriptPath() || 'plugin/reveal-embed-video';

  new Plugin(options);
})();
