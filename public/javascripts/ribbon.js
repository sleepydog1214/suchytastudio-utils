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
 * javascripts/ribbon.js
 *
 * Build the photo ribbon for the photo page and the art page
 *
 * buildPhotoRibbon() - Fill image ribbon.
 * showPrevNextRow() - Display the prev or next ribbon row.
 * getImageData() - Get Image object from JSON data.
 ********************************************************************/

/*********************************************************************
 * buildPhotoRibbon() - Fill image ribbon.
 ********************************************************************/
function buildPhotoRibbon(ribbonObj) {
  // Empty content string
  var imageContent = '';

  $.getJSON( ribbonObj.call, function( data ) {
      // Stick our image data array into a image list variable in the global object
      imageListData = data;

      // For each item in our JSON, add a table row and cells to the content string
      var idx      = 1;
      var rowCount = 0;
      var dataLen  = data.length;
      var dataIdx  = 0;
      $.each(data, function() {
        var thumbName = this.path.path.replace('orig', 'thumbs');
        thumbName += '-thumb.jpg';

        if (idx === 1) {
          var rowId = 'ribbonRow-' + rowCount;
          imageContent += '<tr id="' + rowId + '">';

          if (rowCount !== 0) {
            imageContent += '<td><a href="#" class="prevrow"><div class="leftarrow"></div></a></td>';
          }
          ribbonRows.push('#' + rowId);
          rowCount++;
        }

        imageContent += '<td>' +
                        '<a href="#" class="displayimage" rel="' +
                        this.image + '">' + '<img src="' +
                        thumbName + '" height="75"></a>' +
                        '<a href="#" class="icircle">i</a>' +
                        '<div class="imgInfo">' +
                        '<p>' + this.image + '</p>' +
                        '<input type="button" value="Download"></td>' +
                        '</div>' +
                        '</td>';

        if (idx % 5 === 0) {
          if (dataIdx !== (dataLen - 1)) {
            imageContent += '<td><a href="#" class="nextrow"><div class="rightarrow"></div></a></td>';
          }

          imageContent += '</tr>';
          idx = 1;
        }
        else {
          idx++;
        }

        dataIdx++;
      });

      if (idx % 5 !== 0) {
        imageContent += '</tr>';
      }

      // Inject the whole content string into our existing HTML table
      $('#photoRibbon table tbody').html(imageContent);

      // Hide all but first ribbon row
      for (var i = 1; i < ribbonRows.length; i++) {
        $(ribbonRows[i]).hide();
      }
  });
};

/*********************************************************************
 * showPrevNextRow() - Display the prev or next ribbon row.
 ********************************************************************/
function showPrevNextRow(event) {
  event.preventDefault();

  var thisRow     = $(this).parent().parent();

  if ($(this).hasClass('nextrow')) {
    var nextRow = thisRow.next();
    if (nextRow.length > 0) {
      thisRow.hide();
      nextRow.show();
    }
  }
  else {
    var prevRow = thisRow.prev();
    if (prevRow.length > 0) {
      thisRow.hide();
      prevRow.show();
    }
  }
};

/*********************************************************************
 * getImageData() - Get Image object from JSON data.
 ********************************************************************/
function getImageData(image) {
  // Get Index of object based on id value
  var arrayPosition = imageListData.map(function(arrayItem) {
    return arrayItem.image; }).indexOf(image);

  // Get our Image Object
  return imageListData[arrayPosition];
};

// Show image name and download button
function showImageInfo() {
  event.preventDefault();

  $(this).siblings('.imgInfo').toggle();
  $(this).parent('td').toggleClass('imgBorder');
};
