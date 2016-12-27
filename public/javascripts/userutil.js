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
 * javascripts/userutil.js
 *
 * Utilities page client-side javascript
 *  calls go to users.js
 *
 * populateUserTable() - Fill user table with data.
 * showUserData() - Show/Hide the user data table block.
 * getUserObject() - Get User object from JSON data.
 * updateUserDisplay() - Update user display.
 * showUserInfo() - Show User Info.
 * addUser() - Add User.
 * displayUpdateUser() - Display Update User form.
 * updateUser() - Update User.
 * deleteUser() - Delete User.
 ********************************************************************/

// User list data array for filling in info box
var userListData = [];

/*********************************************************************
 * populateUserTable() - Fill user table with data.
 ********************************************************************/
function populateUserTable() {
  // Empty content string
  var userContent = '';

  $.getJSON( '/users/userlist', function( data ) {
      // Stick our user data array into a user list variable in the global object
      userListData = data;

      // For each item in our JSON, add a table row and cells to the content string
      $.each(data, function(){
          userContent += '<tr>';
          userContent += '<td>' + this.username + '</td>';
          userContent += '<td><a href="#" class="linkshowuser" rel="' + this.email + '">' + this.email + '</a></td>';
          userContent += '<td>' + this.password + '</td>';
          userContent += '<td>' + this.admin + '</td>';
          userContent += '<td>' + this.loggedin + '</td>';
          userContent += '<td>' + this.logindate + '</td>';
          userContent += '<td><a href="#" class="linkupdateuser" rel="' + this.email + '">update</a></td>';
          userContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
          userContent += '</tr>';
      });

      // Inject the whole content string into our existing HTML table
      $('#userList table tbody').html(userContent);
  });
};

/*********************************************************************
 * showUserData() - Show/Hide the user data table block.
 ********************************************************************/
function showUserData(event) {
  event.preventDefault();
  $('#userWrapper').toggle();
}

/*********************************************************************
 * getUserObject() - Get User object from JSON data.
 ********************************************************************/
function getUserObject(email) {
  // Get Index of object based on id value
  var arrayPosition = userListData.map(function(arrayItem) {
    return arrayItem.email; }).indexOf(email);

  // Get our User Object
  return userListData[arrayPosition];
};

/*********************************************************************
 * updateUserDisplay() - Update user display.
 ********************************************************************/
function updateUserDisplay(ob) {
  $('#userInfoId').text(ob._id);
  $('#userInfoName').text(ob.username);
  $('#userInfoEmail').text(ob.email);
  $('#userInfoPwd').text(ob.password);
  $('#userInfoAdmin').text(ob.admin);
  $('#userInfoLoggedIn').text(ob.loggedin);
  $('#userInfoLogInDate').text(ob.logindate);
};

/*********************************************************************
 * showUserInfo() - Show User Info.
 ********************************************************************/
function showUserInfo(event) {
  // Prevent Link from Firing
  event.preventDefault();

  // Retrieve user from link rel attribute
  var thisUserObject = getUserObject($(this).attr('rel'));

  //Populate Info Box
  updateUserDisplay(thisUserObject);
};

/*********************************************************************
 * addUser() - Add User.
 ********************************************************************/
function addUser(event) {
  event.preventDefault();

  // Super basic validation - increase errorCount variable if any fields are blank
  var errorCount = 0;
  $('#addUser input').each(function(index, val) {
      if($(this).val() === '') { errorCount++; }
  });

  // Check and make sure errorCount's still at zero
  if(errorCount === 0) {
      // If it is, compile all user info into one object
      var newUser = {
          'username': $('#addUser fieldset input#inputUserName').val(),
          'email': $('#addUser fieldset input#inputUserEmail').val(),
          'password': $('#addUser fieldset input#inputUserPwd').val(),
          'admin': $('#addUser fieldset input#inputUserAdmin').val(),
          'loggedin': $('#addUser fieldset input#inputUserLoggedIn').val(),
          'logindate': $('#addUser fieldset input#inputUserLogInDate').val()
      }

      // Use AJAX to post the object to our adduser service
      $.ajax({
          type: 'POST',
          data: newUser,
          url: '/users/adduser',
          dataType: 'JSON'
      }).done(function( response ) {
          // Check for successful (blank) response
          if (response.msg === '') {
              // Clear the form inputs
              $('#addUser fieldset input').val('');

              // Update the table
              populateUserTable();

              // Populate Info Box
              newUser._id = '';
              updateUserDisplay(newUser);
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
 * displayUpdateUser() - Display Update User form.
 ********************************************************************/
function displayUpdateUser(event) {
  // Retrieve user from link rel attribute
  var thisUserObject = getUserObject($(this).attr('rel'));

  // Populate the input fields
  $('#inputUserId').val(thisUserObject._id);
  $('#inputUserName').val(thisUserObject.username);
  $('#inputUserEmail').val(thisUserObject.email);
  $('#inputUserPwd').val(thisUserObject.password);
  $('#inputUserAdmin').val(thisUserObject.admin);
  $('#inputUserLoggedIn').val(thisUserObject.loggedin);
  $('#inputUserLogInDate').val(thisUserObject.logindate);

  // Show Update User form
  $("#updateUser").show();
};

/*********************************************************************
 * updateUser() - Update User.
 ********************************************************************/
function updateUser(event) {
  event.preventDefault();

  // Super basic validation - increase errorCount variable if any fields are blank
  var errorCount = 0;
  $('#updateUser input').each(function(index, val) {
      if($(this).val() === '') { errorCount++; }
  });

  // Check and make sure errorCount's still at zero
  if(errorCount === 0) {
      // Get user id from hidden input
      var userId = $('#updateUser fieldset input#inputUserId').val();

      // Compile all user info into one object
      var newUser = {
          '_id': userId,
          'username': $('#updateUser fieldset input#inputUserName').val(),
          'email': $('#updateUser fieldset input#inputUserEmail').val(),
          'password': $('#updateUser fieldset input#inputUserPwd').val(),
          'admin': $('#updateUser fieldset input#inputUserAdmin').val(),
          'loggedin': $('#updateUser fieldset input#inputUserLoggedIn').val(),
          'logindate': $('#updateUser fieldset input#inputUserLogInDate').val()
      }

      // Use AJAX to post the object to our updateuser service
      $.ajax({
          type: 'PUT',
          data: newUser,
          url: '/users/updateuser/' + userId,
          dataType: 'JSON'
      }).done(function( response ) {
          // Check for successful (blank) response
          if (response.msg === '') {
              // Hide the Update User form
              $('#updateUser').hide();

              // Update the table
              populateUserTable();
              updateUserDisplay(newUser);
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
 * deleteUser() - Delete User.
 ********************************************************************/
function deleteUser(event) {
  event.preventDefault();

  // Pop up a confirmation dialog
  var confirmation = confirm('Are you sure you want to delete this user?');

  // Check and make sure confirmed
  if (confirmation === true) {
      // If they did, do our delete
      $.ajax({
          type: 'DELETE',
          url: '/users/deleteuser/' + $(this).attr('rel')
      }).done(function( response ) {
          // Check for a successful (blank) response
          if (response.msg === '') {
          }
          else {
              alert('Error: ' + response.msg);
          }

          // Update the table
          var userNone = {'_id': '', 'username': '', 'email': '',
                          'password': '', 'admin': '',
                          'loggedin': '', 'logindate': ''};
          populateUserTable();
          updateUserDisplay(userNone);
      });
  }
  else {
      // If they said no to the confirm, do nothing
      return false;
  }
};
