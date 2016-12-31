/*********************************************************************
The MIT License (MIT)

Copyright (c) 2016 Thomas Suchyta

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 ********************************************************************/

/*********************************************************************
 * javascripts/art.js
 *
 * displayImage() - Display original and edit image.
 * downloadImage() - Download image from server.
 ********************************************************************/

// Imagelist data array for filling in photo ribbon
var imageListData = [];
var ribbonRows = [];

/*********************************************************************
 * DOM Ready
 ********************************************************************/
$(document).ready(function() {
  var ribbonObj = {'call': '/images/editslist',
                   'thumbDir': 'edits/thumbs/'};

  buildPhotoRibbon(ribbonObj);

  $('#photoArt a img.orig').hide();
  $('#photoArt a img.edit').hide();

  // Display image on click
  $('#photoRibbon table tbody').on('click', 'td a.displayimage', displayImage)
  $('#photoRibbon table tbody').on('click', 'td a.prevrow', showPrevNextRow);
  $('#photoRibbon table tbody').on('click', 'td a.nextrow', showPrevNextRow);

  // Show image info on circle click
  $('#photoRibbon table tbody').on('click', 'td a.icircle', showImageInfo);

  // Download the image
  $('#photoRibbon table tbody').on('click', 'td input', downloadImage);
});

/*********************************************************************
 * displayImage() - Display original and edit image.
 ********************************************************************/
function displayImage(event) {
  // Retrieve image from link rel attribute
  var thisImageObject = getImageData($(this).attr('rel'));
  var origPath = thisImageObject.orig;
  var editPath = thisImageObject.path.path;
  var data = {'src': origPath,
              'alt': thisImageObject.image};

  $('#photoArt a.orig').attr({'href': origPath});
  $('#photoArt a img.orig').attr(data);
  $('#photoArt a img.orig').show();

  data.src = editPath;
  $('#photoArt a.edit').attr({'href': editPath});
  $('#photoArt a img.edit').attr(data);
  $('#photoArt a img.edit').show();
};

/*********************************************************************
 * downloadImage() - Download image from server.
 ********************************************************************/
function downloadImage(event) {
  event.preventDefault();

  var img = $(this).siblings('p').text();
  var path = 'public/edits/orig/' + img;

  var form = $('<form>', {method: 'POST', action: '/images/downloadimage'});
  form.append($('<input>', {name: 'path', value: path}));
  form.submit();
};
