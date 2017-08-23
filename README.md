# Embed Local Video in a Reveal Presentation

A simple [reveal.js](https://github.com/hakimel/reveal.js) plugin that lets you embed video from local sources
(such as a webcam) on a presentation.

I use this when giving online talks. It lets me put myself on top of
slides, in any position (including full screen).

## Demo

[Live Demo](https://rawgit.com/ThomasWeinert/reveal-embed-video/master/example/index.html)


## Usage

```HTML
<div class="reveal" data-video="small top-right">
  <section class="slides">
    <section>
      ... regular slide
    </section>
    <section data-video="big top-right">
      ... slide with large video 
    </section>
  </section>
</div>  
```

The `data-video` attribute contains class names. If a slide
does not have it the plugin looks at its ancestor nodes. 

The default classes are:

   * `big` = video width 90% of browser window
   * `small` = video width 15% of browser window
   * `top-left` = position top left corner
   * `top-right` = position top right corner
   * `bottom-left` = position bottom left corner
   * `bottom-right` = position bottom right corner
   
If you set only a position the video width will be 25% of the browser
window.

You can define and use you own CSS classes to position/format the video element.
The video element always has the class `live-video` to avoid conflict with other
videos in your presentation.

```CSS
video.live-video.your-class {
  /* your css definitions */
}
```

You can set the `data-video` attribute to `false` to disable the video.

### Keyboard Shortcut

Use the key `[C]` to enabled/disable the video. By default it will be disabled at 
start. The `enabled` option can change this.

### Switching Video Input

If you have multiple video inputs (front ant rear camera) you can click on 
the video to cycle trough them.

## Installation

There are several ways to install reveal_external:

* The manual way: Save `reveal-embed-video.js` and `reveal-embed-video.js` into your 
  project structure
* Install with bower: bower install reveal_embed_video

## Configuration

Add the plugin to the dependencies:

    dependencies: [
        ...
        { src: 'vendor/reveal-embed-video.js' },
        
### Options

    'embed-video': {
        enabled: false, // optional, default false
        persistent: false, // optional, default false
        path: '/path/to/plugin' // optional, default null
    }       
    
#### enabled

Enable the video stream directly at startup. Pressing `[C]` will still allow you to 
toggle it.

#### persistent

Keep the stream open (the camera active) after opening it once. If it is disabled
the plugin will deactivate the camera if the video is not used.

#### path 

The path for the css file (`reveal-embed-vide.css`). The plugin will try to calculate that itself.

## Limitations

Most modern browsers will not allow local media devices to be opened
from `file://` pages. To use this locally, you need to serve your
presentation using a local web server (such as `npm start`).

## Authors

* Thomas Weinert, thomas@weinert.info (current maintainer)
* Dave Thomas, @pragdave, dave@pragdave.me (original author)

## License

MIT, see [LICENSE.md](LICENSE.md)
