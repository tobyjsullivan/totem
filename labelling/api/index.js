const http = require('http');
const url = require('url');
const fs = require('fs');
const multiparty = require('multiparty');

function serve(req, res) {
  const parsed = url.parse(req.url);
  console.log('%s %s', req.method, parsed.path);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  switch(req.method) {
  case 'GET':
    handleGet(req, res);
    break;
  case 'OPTION':
    res.end();
    break;
  case 'POST':
    handlePost(req, res);
    break;
  default:
    res.statusCode = 404;
    res.end();
    break;
  }
  console.log(res.statusCode);
}

function handleGet(req, res) {
  const parsed = url.parse(req.url);
  switch(parsed.pathname) {
  case '/':
    handleGetRoot(req, res);
    break;
  default:
    res.statusCode = 404;
    res.end();
    break; 
  }
}

function handlePost(req, res) {
  const parsed = url.parse(req.url);
  switch(parsed.pathname) {
  case '/documents':
    handlePostDocuments(req, res);
    break;
  default:
    res.statusCode = 404;
    res.end();
    break;
  }
}

function handleGetRoot(req, res) {
  res.write('online');
  res.end();
}

function handlePostDocuments(req, res) {
  const form = new multiparty.Form();
  form.on('error', function(err) {
    res.statusCode = 400;
    res.write(err.message);
    res.end();
  });
  form.on('part', function(part) {
    if(part.filename) {
      console.log('Received file %s', part.filename);
      part.resume();
    } else {
      console.log('Received field %s', part.name);
      part.resume();
    }
  });
  form.on('close', function() {
    res.end();
  });
  form.parse(req);
}

http.createServer(serve).listen(8080);
