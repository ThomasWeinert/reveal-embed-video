# Embed Local Video in a Reveal Presentation

A simple reveal.js plugin that lets you embed video from local sources
(such as a webcam) on a Reveal presentation.

I use this when giving online talks. It lets me put myself on top of
slides, in any position (including full screen).


## Usage

    <section data-video="class-name">

       .. regular slide

    </section>


The _class-name_ is a CSS class used to position the video. I
personally set up a default style for videos with tucks it into one
corner, and then have overrides for when I want to have it fill the
frame.


    video {
      position: fixed;
      right: 5%;
      top: 5%;
      z-index: 12;
      width: 25%;
      height: auto;
      transition: width ease 1s, height ease 1s;
    }

    video.big {
      width: 90%;
      max-height: 90%;
    }

An alternative is to have explicit styles for the positions you want:

    video {
      position: fixed;
      z-index: 12;
      width: 25%;
      height: auto;
      transition: width ease 1s, height ease 1s;
      border: 3px solid #888 !important;
      box-shadow: 3px 3px 3px #000;
    }

    video.blank {
      display: none;
    }

    video.top-right {
      right: 5%;
      top: 5%;
    }

    video.top-left {
      left: 5%;
      top:  5%;
    }

    video.bottom-right {
      right:  5%;
      bottom: 5%;
    }

    video.bottom-left {
      left:   5%;
      bottom: 5%;
    }

    video.big {
      left: 5%;
      top:  5%;
      width: 90%;
      max-height: 90%;
      border: none !important;
      box-shadow: none !important;
    }


## Installation

Copy the reveal-embed-video.js file into your project, and add it as a
dependency.

    dependencies: [
        . . .
        { src: 'vendor/reveal-embed-video.js' },

## Limitations

Most modern browsers will not allow local media devices to be opened
from `file://` pages. To use this locally, you need to serve your
presentation using a local web server (such as `npm start`).


## Author

Dave Thomas, @pragdave, dave@pragdave.me

## License

See LICENSE.md
