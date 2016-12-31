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
 * javascripts/imageutil.js
 *
 * Utilities page client-side javascript
 *  calls go to routes/images.js
 *
 * populateImageTable() - Fill image table with data.
 * genRandomInt() - Generate random Int between min(included) and
 *                  max(excluded).
 * setRandomImage() - Get random original or edit image.
 * setHomePageOrig() - Set Home Page orig photo.
 * setHomePageEdit() - Set Home Page edit image.
 * showImageData() - Show/Hide the image table block.
 * getImageObject() - Get Image object from JSON data.
 * displayUpdateImage() - Display Update Image form.
 * updateImage() - Update Image.
 * previewImage() - Preview image before upload.
 * deleteImage() - Delete Image.
 ********************************************************************/

 // Imagelist data array for filling in info box
 var imageListData = [];

/*********************************************************************
 * populateImageTable() - Fill image table with data.
 ********************************************************************/
function populateImageTable() {
  // Empty content string
  var imageContent = '';

  // jQuery AJAX call for JSON
  $.getJSON( '/images/imagelist', function( data ) {
      // Stick our image data array into a image list variable in the global object
      imageListData = data;

      // For each item in our JSON, add a table row and cells to the content string
      $.each(data, function(){
        if (this.path.path.search(/orig/) >= 0) {
          var thumbName = this.path.path.replace('orig', 'thumbs');
          thumbName = thumbName.replace('public/', '');
          thumbName += '-thumb.jpg';
          imageContent += '<tr>';
          imageContent += '<td><a href="#" class="linkupdateimage" rel="' + this.image + '">' +
            '<img src="' + thumbName + '" width="50" height="50">' + this.image + '</a></td>';
          imageContent += '<td>' + this.path.path + '</td>';
          imageContent += '<td>' + this.size + '</td>';
          imageContent += '<td>' + this.mimetype + '</td>';
          imageContent += '<td>' + this.timestamp + '</td>';
          imageContent += '<td>' + this.desc + '</td>';
          imageContent += '<td><a href="#" class="linkdeleteimage" rel="' + this._id + '">delete</a></td>';
          imageContent += '</tr>';
        }
      });

      // Inject the whole content string into our existing HTML table
      $('#imageList table tbody').html(imageContent);
  });
};

/*********************************************************************
 * genRandomInt() - Generate random Int between min(included) and
 *                  max(excluded).
 ********************************************************************/
function genRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

/*********************************************************************
 * setRandomImage() - Get random original or edit image.
 ********************************************************************/
function setRandomImage(data, img) {
    var imageLength = data.length;
    var randomImg = genRandomInt(0, imageLength);

    // Set the image
    var path = data[randomImg].path;
    img.attr('src', path);
};

/*********************************************************************
 * setHomePageOrig() - Set Home Page orig photo.
 ********************************************************************/
function setHomePageOrig() {
  // Empty content string
  var imageContent = '';

  // jQuery AJAX call for JSON
  $.getJSON( '/images/imagelist', function( data ) {
    setRandomImage(data, $('#homeDisplay img.orig'));
  });
};

/*********************************************************************
 * setHomePageEdit() - Set Home Page edit image.
 ********************************************************************/
function setHomePageEdit() {
  // Empty content string
  var imageContent = '';

  // jQuery AJAX call for JSON
  $.getJSON( '/images/editslist', function( data ) {
    setRandomImage(data, $('#homeDisplay img.edit'));
  });
};

/*********************************************************************
 * showImageData() - Show/Hide the image table block.
 ********************************************************************/
function showImageData(event) {
  event.preventDefault();
  $('#imageWrapper').toggle();
}

/*********************************************************************
 * getImageObject() - Get Image object from JSON data.
 ********************************************************************/
function getImageObject(image) {
  // Get Index of object based on id value
  var arrayPosition = imageListData.map(function(arrayItem) {
    return arrayItem.image; }).indexOf(image);

  // Get our Image Object
  return imageListData[arrayPosition];
};

/*********************************************************************
 * displayUpdateImage() - Display Update Image form.
 ********************************************************************/
function displayUpdateImage(event) {
  // Retrieve image from link rel attribute
  var thisImageObject = getImageObject($(this).attr('rel'));

  // Populate the input fields
  $('#inputImageId').val(thisImageObject._id);
  $('#inputImageName').val(thisImageObject.image);
  $('#inputImagePath').val(thisImageObject.path.path);
  $('#inputImageSize').val(thisImageObject.size);
  $('#inputImageMimetype').val(thisImageObject.mimetype);
  $('#inputImageTimestamp').val(thisImageObject.timestamp);
  $('#inputImageDesc').val(thisImageObject.desc);

  // Show Update Image form
  $("#updateImage").show();
};

/*********************************************************************
 * updateImage() - Update Image.
 ********************************************************************/
function updateImage(event) {
  event.preventDefault();

  // Super basic validation - increase errorCount variable if any fields are blank
  var errorCount = 0;
  $('#updateImage input').each(function(index, val) {
      if($(this).val() === '') { errorCount++; }
  });

  // Check and make sure errorCount's still at zero
  if(errorCount === 0) {
      // Get image id from hidden input
      var imageId = $('#updateImage fieldset input#inputImageId').val();

      // Compile all image info into one object
      var newImage = {
          '_id': imageId,
          'image': $('#updateImage fieldset input#inputImageName').val(),
          'path': $('#updateImage fieldset input#inputImagePath').val(),
          'size': $('#updateImage fieldset input#inputImageSize').val(),
          'mimetype': $('#updateImage fieldset input#inputImageMimetype').val(),
          'timestamp': $('#updateImage fieldset input#inputImageTimestamp').val(),
          'desc': $('#updateImage fieldset input#inputImageDesc').val()
      }

      // Use AJAX to post the object to our updateimage service
      $.ajax({
          type: 'PUT',
          data: newImage,
          url: '/images/updateimage/' + imageId,
          dataType: 'JSON'
      }).done(function( response ) {
          // Check for successful (blank) response
          if (response.msg === '') {
              // Hide the Update Image form
              $('#updateImage').hide();

              // Update the table
              populateImageTable();
          }
          else {
              // If something goes wrong, alert the error message that our service returned
              alert('Error: ' + response.msg);
          }
      });
  }
  else {
      // If errorCount is more than 0, error out
      alert('Please fill in all fields');
      return false;
  }
};

/*********************************************************************
 * previewImage() - Preview image before upload.
 ********************************************************************/
function previewImage() {
  var oFReader = new FileReader();
  oFReader.readAsDataURL($("#sdd-photo")[0].files[0]);

  oFReader.onload = function (oFREvent) {
      $("#uploadPreview")[0].src = oFREvent.target.result;
      $('#addImage img').show();
    };
};

/*********************************************************************
 * deleteImage() - Delete Image.
 ********************************************************************/
function deleteImage(event) {
  event.preventDefault();

  // Pop up a confirmation dialog
  var confirmation = confirm('Are you sure you want to delete this image?');

  // Check and make sure confirmed
  if (confirmation === true) {
      // If they did, do our delete
      $.ajax({
          type: 'DELETE',
          url: '/images/deleteimage/' + $(this).attr('rel')
      }).done(function( response ) {
          // Check for a successful (blank) response
          if (response.msg === '') {
          }
          else {
              alert('Error: ' + response.msg);
          }

          // Update the table
          populateImageTable();
      });
  }
  else {
      // If they said no to the confirm, do nothing
      return false;
  }
};
