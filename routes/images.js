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
 * routes/images.js - controller
 *
 * Functions to access the MongoDB database
 * imageList and editList collections.
 *  dbname: nodejs
 *
 * var storage - Set multer file upload destination and filename.
 * var upload - Set multer file filter and limits.
 * authenticateStorj() - Use storj private key to authenticate.
 * uploadToStorj() - Copy file to Storj bucket.
 * deleteFromStorj() - Delete file from Storj bucket.
 * deleteLocalFiles() - Delete local files after moving to Storj dir.
 * clone() - Create a copy of an object.
 * makeThumbOvly() - Create thumbnail and overlay images.
 * GET imagelist - Read the collection.
 * GET editslist - Read the collection.
 * POST upload - Upload new image.
 * DELETE deleteimage - Delete from collection
 * PUT updateimage - Update image in collection.
 * GET editpoll - Check if edited file exists.
 * PUT editimage - Edit the image using graphicsmagick/imagemagick.
 * POST downloadimage - Download requested image.
 ********************************************************************/
var express  = require('express');
var router   = express.Router();
var fs       = require('fs');
var multer   = require('multer');
var path     = require('path');
var moment   = require('moment');
var exec     = require('child_process').exec;
var spawn    = require('child_process').spawn;
var out      = fs.openSync('./edit-image.log', 'a');
var err      = fs.openSync('./edit-image.log', 'a');

var storj    = require('storj-lib');
var api      = 'https://api.storj.io';

/*********************************************************************
 * var storage - Set multer file upload destination and filename.
 ********************************************************************/
var storage  = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/orig/')
  },
  filename: function (req, file, cb) {
    var timestamp = moment().format('MDYYHms');
    var suffix = path.extname(file.originalname).toLowerCase();
    var fname = file.fieldname + '-' + timestamp + suffix;
    cb(null, fname);
  }
});

/*********************************************************************
 * var upload - Set multer file filter and limits.
 ********************************************************************/
var upload = multer({ storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('fileFilter: ');
    console.dir(file);
    if (path.extname(file.originalname.toLowerCase()) !== '.jpg' &&
        path.extname(file.originalname.toLowerCase()) !== '.jpeg' &&
        path.extname(file.originalname.toLowerCase()) !== '.png') {
      return cb(null, false)
    }
    return cb(null, true);
  },
  limits: {
    files: 1,
    fileSize: 4194304
  },
  onFileSizeLimit: function (file) {
    // but res (response) object is not existing here
    file.error = {
        message: "Upload failed",
        status: MARankings.Enums.Status.FILE_TOO_LARGE
        // status: -6
    };
  },
  onFileUploadComplete: function (file, req, res) {
    if (file.error){
        res.send(file.error);
    }
  }
});

/*********************************************************************
 * authenticateStorj() - Use storj private key to authenticate the
 *                       storj client.
 ********************************************************************/
var authenticateStorj = function() {
  var keypair = storj.KeyPair(process.env.STORJ_PRIVATE_KEY);
  var concurrency = 6;

  var client = storj.BridgeClient(api, {
    keyPair: keypair,
    concurrency: concurrency
  });

  return client;
};

/*********************************************************************
 * uploadToStorj() - Copy file to Storj bucket
 ********************************************************************/
var uploadToStorj = function(filepath, collection, newImage) {
  var client = authenticateStorj();

  // Determine the storj bucket to use base on the filepath name
  // uploads/orig -> STORJ_UPLOADS_ORIG
  // uploads/ovly -> STORJ_UPLOADS_OVLY
  // uploads/thumbs -> STORJ_UPLOADS_THUMBS
  // edits/orig -> STORJ_UPLOADS_ORIG
  // edits/ovly -> STORJ_UPLOADS_OVLY
  // edits/thumbs -> STORJ_UPLOADS_THUMBS
  console.log('filepath: ', filepath);
  var bucket;

  if (filepath.search(/uploads\/orig/) >= 0) {
   bucket = process.env.STORJ_UPLOADS_ORIG;
  }
  else if (filepath.search(/uploads\/ovly/) >= 0) {
   bucket = process.env.STORJ_UPLOADS_OVLY;
  }
  else if (filepath.search(/uploads\/thumbs/) >= 0) {
   bucket = process.env.STORJ_UPLOADS_THUMBS;
  }
  else if (filepath.search(/edits\/orig/) >= 0) {
   bucket = process.env.STORJ_EDITS_ORIG;
  }
  else if (filepath.search(/edits\/ovly/) >= 0) {
   bucket = process.env.STORJ_EDITS_OVLY;
  }
  else if (filepath.search(/edits\/thumbs/) >= 0) {
   bucket = process.env.STORJ_EDITS_THUMBS;
  }

  // temp file to store encrypted version
  var tmpPath = filepath + '.crypt';

  // Get the storj keyring and keep in key.ring dir
  var keyRing = storj.KeyRing('./', process.env.STORJ_KEYRING);

  // Prepare to encrypt file for upload
  var secret = new storj.DataCipherKeyIv();
  var encrypter = new storj.EncryptStream(secret);

  // Encrypt the file and store it temporarily
  fs.createReadStream(filepath)
    .pipe(encrypter)
    .pipe(fs.createWriteStream(tmpPath)).on('finish', function() {
      console.log('finish encrypting: ', tmpPath)

      //  Create a token for uploading to the bucket
      client.createToken(bucket, 'PUSH', function(err, token) {
        if (err) {
          console.log('createToken error: ', err.message);
        }

        // Store the file using bucket id, token, and encrypted file
        client.storeFileInBucket(bucket, token.token,
                                 tmpPath, function(err, file) {
          if (err) {
            console.log('storeFileInBucket error: ', err.message);
          }

          // Save key for access to the file
          keyRing.set(file.id, secret);

          // success
          // Store file.id  with filename in db
          console.log(
            'info',
            'Name: %s, Type: %s, Size: %s bytes, ID: %s',
            [file.filename, file.mimetype, file.size, file.id]
          );

          // Save info for later access
          var fileinfo = { path: filepath,
                           bucket: bucket,
                           id: file.id };
          newImage.path = fileinfo;
          collection.insert(newImage);

          // Delete the tmp file
          fs.unlink(tmpPath, function(err) {
            if (err) {
              console.log('tmp file delete error: ', err);
            }
          })
        });
      });
    });
};

 /*********************************************************************
 * deleteFromStorj() - Delete file from Storj bucket
 ********************************************************************/
 var deleteFromStorj = function(filepath) {
 };

/*********************************************************************
 * deleteLocalFiles() - Delete local files after moving to Storj dir.
 ********************************************************************/
var deleteLocalFiles = function(fpath) {
  fs.unlink(fpath, function(err) {
    if (err) {
      console.log('Could not delete localfile: ' + fpath);
    }
  });
};

/*********************************************************************
 * clone() - create a copy of an object.
 ********************************************************************/
var clone = function clone(obj) {
  if (null == obj || "object" != typeof obj) {
    return obj;
  }
  var copy = new Object();
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = clone(obj[key]);
    }
  }
  return copy;
};

/*********************************************************************
 * makeThumbOvly() - Create thumbnail and overlay images.
 ********************************************************************/
var makeThumbOvly = function(filepath, filename, collection, newImage) {
  var command = ['./bin/thumb-ovly.sh',
                 filepath];
  exec(command.join(' '), function(err, stdout, stderr) {
    if (err) {
      console.log('thumb-ovly err: ' + err);
    }
    console.log('finished make thumb-ovly');

    //upload orig/photo, ovly/photo and thumbs/photo to Storj
    var uploadPath = path.dirname(filepath);
    var suffix = path.extname(filename);
    var ovlyName = '';
    var ovlyPath = uploadPath.replace('orig', 'ovly/');
    var thumbName = '';
    var thumbPath = uploadPath.replace('orig', 'thumbs/');

    if (suffix === '.jpg') {
      ovlyName = filename.replace('.jpg', '.jpg-ovly.jpg');
      thumbName = filename.replace('.jpg', '.jpg-thumb.jpg');
    }
    else if (suffix === '.jpeg') {
      ovlyName = filename.replace('.jpeg', '.jpeg-ovly.jpg');
      thumbName = filename.replace('.jpeg', '.jpeg-thumb.jpg');
    }
    else if (suffix === '.png') {
      ovlyName = filename.replace('.png', '.png-ovly.jpg');
      thumbName = filename.replace('.png', '.png-thumb.jpg');
    }

    ovlyPath += ovlyName;
    thumbPath += thumbName;

    uploadToStorj(filepath, collection, newImage);

    var ovlyImage = clone(newImage);
    ovlyImage.image = ovlyName;
    uploadToStorj(ovlyPath, collection, ovlyImage);

    var thumbImage = clone(newImage);
    thumbImage.image = thumbName;
    uploadToStorj(thumbPath, collection, thumbImage);

    // Now delete the local files in the public/uploads dir
    //deleteLocalFiles(filepath);
    //deleteLocalFiles(ovlyPath);
    //deleteLocalFiles(thumbPath);
  });
}

/*********************************************************************
 * GET imagelist - Read the collection.
 ********************************************************************/
router.get('/imagelist', function(req, res) {
    var db = req.db;
    var collection = db.get('imageList');
    collection.find({},{},function(e,docs){
        res.json(docs);
    });
});

/*********************************************************************
 * GET editslist - Read the collection.
 ********************************************************************/
router.get('/editslist', function(req, res) {
    var db = req.db;
    var collection = db.get('editImageList');
    collection.find({},{},function(e,docs){
        res.json(docs);
    });
});

/*********************************************************************
 * POST upload - Upload new image.
 ********************************************************************/
router.post('/upload', upload.single('sdd-photo'), function (req, res, next) {
  // Write data to imageList collection
  var db = req.db;
  var collection = db.get('imageList');
  var timestamp = moment().format('MM-DD-YYYY HH:mm:ss');

  if (req.file !== undefined) {
    var newImage = {'image': req.file.filename,
                    'path': '',
                    'size': req.file.size,
                    'mimetype': req.file.mimetype,
                    'timestamp': timestamp,
                    'desc': req.body.desc };

    makeThumbOvly(req.file.path, req.file.filename, collection, newImage);
  }

  res.redirect('/util');
});

/*********************************************************************
 * DELETE deleteimage - Delete from collection
 ********************************************************************/
router.delete('/deleteimage/:id', function(req, res) {
  var db = req.db;
  var collection = db.get('imageList');
  var imageToDelete = req.params.id;

  // Delete the image files
  collection.findOne({'_id': imageToDelete}, {}, function(e, docs) {
    var origName  = 'public/uploads/orig/' + docs.image;
    var thumbName = 'public/uploads/thumbs/' + docs.image + '-thumb.jpg';
    var ovlyName  = 'public/uploads/ovly/' + docs.image + '-ovly.jpg';

    deleteFromStorj(origName);
    deleteFromStorj(ovlyName);
    deleteFromStorj(thumbName);
  });

  // Delete from collection
  collection.remove({ '_id' : imageToDelete }, function(err) {
    res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
  });
});

/*********************************************************************
 * PUT updateimage - Update image in collection.
 ********************************************************************/
router.put('/updateimage/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('imageList');
    var imageToUpdate = req.params.id;
    collection.update({ '_id' : imageToUpdate }, req.body, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});

/*********************************************************************
 * GET editpoll - Check if edited file exists.
 ********************************************************************/
router.get('/editpoll', function(req, res) {
  var db = req.db;
  var collection = db.get('editImageList');

  var checkPath = req.query.path;
  console.log('editpoll call: ' + checkPath);
  var pollResults = {'found': false};

  fs.stat(checkPath, function(err, stats) {
    if (!err && stats.isFile()) {
      pollResults.found = true;

      //Once edits are done, create thumbnail, send to Storj, and
      //save in db.
      var newImage = {'image': req.query.image,
                      'path': '',
                      'orig': req.query.orig,
                      'checked': req.query.checked,
                      'timestamp': req.query.timestamp };

      makeThumbOvly(checkPath, req.query.image, collection, newImage);
    }
    res.json(pollResults);
  });
});

/*********************************************************************
 * PUT editimage - Edit the image using graphicsmagick/imagemagick.
 ********************************************************************/
router.put('/editimage', function(req, res) {
  var timestamp = moment().format('MM-DD-YYYY HH:mm:ss');

  // Edit photo paths and resulting dest file names.
  var origPath    = 'public/' + req.body.path;
  var origName    = path.basename(origPath);

  editName        = 'edit-' + origName;
  var editPath    = 'public/edits/orig/' + editName;

  var paintName   = 'pedit-' + origName;
  var paintPath3  = 'public/edits/orig/' + paintName;

  var paintV2     = 'p2edit-' + origName;
  var paintPathV2 = 'public/edits/orig/' + paintV2;

  var drawTemp1   = 'dedit-' + origName;
  var drawPath1   = 'public/edits/orig/' + drawTemp1;

  var drawV2      = 'd2edit-' + origName;
  var drawPathV2  = 'public/edits/orig/' + drawV2;

  var sepiaTemp1  = 'sedit-' + origName;
  var sepiaPath1  = 'public/edits/orig/' + sepiaTemp1;

  var checked     = req.body.checked;

  var newImage = { 'image': editName,
                   'path': editPath,
                   'orig': origPath,
                   'checked': checked,
                   'timestamp': timestamp };

  var command = '';
  var commandArgs = new Array();

  // Run basic photo edit script
  if (checked === 'basic') {
    command = './bin/basic.sh';
    commandArgs.push(origPath);
    commandArgs.push(editPath);
  }

  // Run paint-like edit script
  else if (checked === 'paint') {
    newImage.image = paintName;
    newImage.path  = paintPath3;

    command = './bin/paint.sh';
    commandArgs.push(origPath);
    commandArgs.push(paintPath3);
  }

  // Run paint-like (cpu/memory intensive) edit script
  else if (checked === 'paint_v2') {
    newImage.image = paintV2;
    newImage.path  = paintPathV2;

    command = './bin/paint_v2.sh';
    commandArgs.push(origPath);
    commandArgs.push(paintPathV2);
  }

  // Run draw-like edit script
  else if (checked === 'draw') {
    newImage.image = drawTemp1;
    newImage.path  = drawPath1;

    command = './bin/draw.sh';
    commandArgs.push(origPath);
    commandArgs.push(drawPath1);
  }

  // Run draw-like (cpu/memory intensive) edit script
  else if (checked === 'draw_v2') {
    newImage.image = drawV2;
    newImage.path  = drawPathV2;

    command = './bin/draw_v2.sh';
    commandArgs.push(origPath);
    commandArgs.push(drawPathV2);
  }

  // Run sepia-tone edit script
  else if (checked === 'sepia') {
    newImage.image = sepiaTemp1;
    newImage.path  = sepiaPath1;

    command = './bin/sepia.sh';
    commandArgs.push(origPath);
    commandArgs.push(sepiaPath1);
  }

  // Fork script process
  console.log('exec command: ' +
              command + ' ' + commandArgs.join(' '));
  var child = spawn(command, commandArgs, {
                    detached: true,
                    stdio: ['ignore', out, err]});
  child.unref();

  res.json(newImage);
});

/*********************************************************************
 * POST downloadimage - Download requested image.
 ********************************************************************/
router.post('/downloadimage', function(req, res) {
  console.log('download: ' + req.body.path);

  var downloadPath = req.body.path;
  /*var tempFile = 'public/downloads/' + path.basename(downloadPath);

  var params = {
    localFile: tempFile,

    s3Params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: downloadPath
    }
  };

  var downloadFile = client.downloadFile(params);
  downloadFile.on('error', function(err) {
    console.error("unable to download:", err.stack);
    res.redirect('/index');
  });

  downloadFile.on('end', function() {
    console.log("done downloading");
    res.download(tempFile, function(err) {
      if (err) {
        console.log('end download err: ' + err)
      }
      deleteLocalFiles(tempFile);
    });
  });*/

  res.download(downloadPath, function(err) {
    if (err) {
      console.log('end download err: ' + err)
    }
  });
});

module.exports = router;
