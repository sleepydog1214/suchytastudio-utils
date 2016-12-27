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
 * javascripts/util.js
 *
 * Utilities page client-side javascript
 *  calls go to images.js or users.js
 ********************************************************************/

/*********************************************************************
 * DOM Ready
 ********************************************************************/
$(document).ready(function() {
  // Initially hide data blocks
  $('#imageWrapper').hide();
  $('#userWrapper').hide();

  // Hide Update forms
  $("#updateImage").hide();
  $("#updateUser").hide();

  // Populate the collection tables on initial page load
  populateImageTable();
  populateUserTable();

  // Image Data block click
  $('#imageData').on('click', showImageData);

  // User Data block click
  $('#userData').on('click', showUserData);

 // Display Update Image block on click
 $('#imageList table tbody').on('click', 'td a.linkupdateimage', displayUpdateImage)

 // Update Image button click
 $('#btnUpdateImage').on('click', updateImage);

  // Delete Image link click
  $('#imageList table tbody').on('click', 'td a.linkdeleteimage', deleteImage);

 // Hide add user image preview
 $('#addImage img').hide();

  // User name link click
  $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);

  // Add User button click
 $('#btnAddUser').on('click', addUser);

 // Display Update User block on click
 $('#userList table tbody').on('click', 'td a.linkupdateuser', displayUpdateUser)

 // Update User button click
 $('#btnUpdateUser').on('click', updateUser);

  // Delete User link click
  $('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);
});
