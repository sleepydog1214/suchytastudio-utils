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
 * javascripts/photos.js
 *
 * Functions to handle the photos edit page
 *
 * displayImage() - Display original image.
 * editimage() - Edit the image.
 * pollEditImage() - Poll for completed edit image.
 * downloadImage() - Download the original image.
 ********************************************************************/

// Imagelist data array for filling in photo ribbon
var imageListData = [];
var ribbonRows = [];

/*********************************************************************
 * DOM Ready
 ********************************************************************/
$(document).ready(function() {
  var ribbonObj = {'call': '/images/imagelist'};
  buildPhotoRibbon(ribbonObj);

  $('#photoEdit form p').hide();
  $('#photoEdit form a img.orig').hide();
  $('#editRadio label').hide();
  $('#editRadio input[type=submit]').hide();

  // Display image on click
  $('#photoRibbon table tbody').on('click', 'td a.displayimage', displayImage)
  $('#photoRibbon table tbody').on('click', 'td a.prevrow', showPrevNextRow);
  $('#photoRibbon table tbody').on('click', 'td a.nextrow', showPrevNextRow);

  // Show image info on circle click
  $('#photoRibbon table tbody').on('click', 'td a.icircle', showImageInfo);

  // Download the image
  $('#photoRibbon table tbody').on('click', 'td input', downloadImage);

  // Send image edit data on form submit
  $('#photoEdit form').submit(editImage);
});

/*********************************************************************
 * displayImage() - Display original image.
 ********************************************************************/
function displayImage(event) {
  // Retrieve image from link rel attribute
  var thisImageObject = getImageData($(this).attr('rel'));
  var path = thisImageObject.path.path;
  path = path.replace('public/', '');
  var data = {'src': path,
              'alt': thisImageObject.image};

  $('#photoEdit form p').text(thisImageObject.desc);
  $('#photoEdit form p').show();
  $('#photoEdit form a.orig').attr({'href': path});
  $('#photoEdit form a img.orig').attr(data);
  $('#photoEdit form a img.orig').show();
  $('#editRadio label').show();
  $('#editRadio input[type=submit]').show();
};

/*********************************************************************
 * editimage() - Edit the image.
 ********************************************************************/
function editImage(event) {
  event.preventDefault();
  console.log($(this));

  var editImage = { 'path': $(this).children('a').attr('href') };

  var checkedRadio = $(this).children('div').children('input[type=radio]:checked');
  editImage.checked = checkedRadio.attr('value');

  $.ajax({
    type: 'PUT',
    data: editImage,
    dataType: 'JSON',
    url: '/images/editimage'
  }).done(function(response) {
    $('#photoEdit form a.orig').attr({'href': '#'});
    $('#photoEdit form a img.orig').attr({'src': '',
                                          'alt': 'display image here'});
    $('#photoEdit form p').hide();
    $('#photoEdit form a img.orig').hide();
    $('#editRadio label').hide();
    $('#editRadio input[type=submit]').hide();

    checkedRadio.attr('checked', false);

    $('#editStatus p').text(response.image + ' processing...');
    pollEditImage({ 'image': response.image,
                    'path': response.path,
                    'orig': response.orig,
                    'checked': response.checked,
                    'timestamp': response.timestamp });
  });
};

/*********************************************************************
 * pollEditImage() - Poll for completed edit image.
 ********************************************************************/
function pollEditImage(editObj) {
  $.ajax({
    type: 'GET',
    data: editObj,
    dataType: 'JSON',
    url: '/images/editpoll'
  }).done(function(response) {
    if (response.found === true) {
      $('#editStatus p').text(editObj.image + ' available');
    }
    else {
      $('#editStatus p').text(editObj.image + ' still processing...');
      setTimeout(pollEditImage, 30000, editObj);
    }
  });
};

/*********************************************************************
 * downloadImage() - Download the original image.
 ********************************************************************/
function downloadImage(event) {
  event.preventDefault();

  var img = $(this).siblings('p').text();
  var path = 'public/uploads/orig/' + img;

  var form = $('<form>', {method: 'POST', action: '/images/downloadimage'});
  form.append($('<input>', {name: 'path', value: path}));
  form.submit();
};
