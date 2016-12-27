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
  * routes/users.js
  *
  * Functions to access the MongoDB database
  * userList collection.
  *  dbname: nodejs
  *
  * GET userlist - Read the collection.
  * POST adduser - Add to collection.
  * DELETE deleteuser - Delete from collection.
  * PUT updateuser - Update user in collection.
 ********************************************************************/
 var express  = require('express');
 var router   = express.Router();
 var password = require('password-hash-and-salt');

/*********************************************************************
  * GET userlist - Read the collection.
 ********************************************************************/
 router.get('/userlist', function(req, res) {
   var db = req.db;
   var collection = db.get('userList');
   collection.find({},{},function(e,docs){
      for (var i = 0; i < docs.length; i++) {
        docs[i].password = '*****';
      }
      res.json(docs);
   });
 });

/*********************************************************************
  * POST adduser - Add to collection.
 ********************************************************************/
 router.post('/adduser', function(req, res) {
   var db = req.db;
   var collection = db.get('userList');

   // Hash and add salt to the password
   var pwd = req.body.password;
   password(pwd).hash(function(error, hash) {
     if(error) {
       throw new Error('Could not hash ' + pwd);
     }

     // Store hash (incl. algorithm, iterations, and salt)
     req.body.password = hash;
     collection.insert(req.body, function(err, result){
         res.send((err === null) ? { msg: '' } : { msg:'error: ' + err }
         );
     });
   });
 });

/*********************************************************************
  * DELETE deleteuser - Delete from collection.
 ********************************************************************/
 router.delete('/deleteuser/:id', function(req, res) {
   var db = req.db;
   var collection = db.get('userList');
   var userToDelete = req.params.id;
   collection.remove({ '_id' : userToDelete }, function(err) {
       res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
   });
 });

/*********************************************************************
  * PUT updateuser - Update user in collection.
 ********************************************************************/
 router.put('/updateuser/:id', function(req, res) {
   var db = req.db;
   var collection = db.get('userList');
   var userToUpdate = req.params.id;

   // Hash and add salt to the password
   var pwd = req.body.password;
   password(pwd).hash(function(error, hash) {
     if(error) {
       throw new Error('Could not hash ' + pwd);
     }

     // Store hash (incl. algorithm, iterations, and salt)
     req.body.password = hash;
     collection.update({ '_id' : userToUpdate }, req.body, function(err) {
       res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
     });
   });
 });

 module.exports = router;
