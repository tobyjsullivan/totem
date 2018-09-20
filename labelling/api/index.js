const http = require('http');
const url = require('url');
const fs = require('fs');
const multiparty = require('multiparty');
const {exec} = require('child_process');
const path = require('path');

// Posted PDF Documents go here
const DOCUMENTS_DIR = './documents';
// Each PDF is converted to PNGs (one per page) which
// go here
const IMAGES_DIR = './images';
// Each page is cut into tiles which go here
const TILES_DIR = './tiles';

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
  
  if (RegExp('/files/(.+)').test(parsed.pathname)) {
    handleGetFile(req, res);
    return;
  }
  switch(parsed.pathname) {
  case '/':
    handleGetRoot(req, res);
    break;
  case '/images':
    handleGetImages(req, res);
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

function handleGetImages(req, res) {
  const images = findImages(IMAGES_DIR);
  res.setHeader('content-type', 'application/json');
  res.write(JSON.stringify(images));
  res.end();
}

function findImages(path) {
  const entities = fs.readdirSync(path, {withFileTypes: true});
  let images = [];
  for (let i in entities) {
    const entity = entities[i];
    const entity_path = `${path}/${entity.name}`;
    if (entity.isFile()) {
      images.push(entity_path);
    } else if (entity.isDirectory()) {
      images = images.concat(findImages(entity_path));
    }
  }

  return images;
}

function handleGetFile(req, res) {
  const parsed = url.parse(req.url);
  const match = RegExp('/files/(.+)').exec(parsed.pathname);
  const filename = match[1];
  const sanitizePath = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
  const rs = fs.createReadStream(sanitizePath);
  const ext = path.parse(filename).ext;
  let contentType = undefined;
  if (ext === 'pdf') {
    contentType = 'application/pdf';
  } else if (ext === 'png') {
    contentType = 'image/png';
  }
  if (contentType) {
    res.setHeader('content-type', contentType);
  }
  rs.pipe(res);
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
      console.log('Receiving file %s', part.filename);
      const tmpDir = fs.mkdtempSync(`${DOCUMENTS_DIR}/`);
      const outpath = `${tmpDir}/${part.filename}`;
      const ws = fs.createWriteStream(outpath);
      part.pipe(ws);
      console.log('File written %s', outpath);
      part.resume();
      const pImgDir = convertDocumentToImages(outpath);
      pImgDir.then(function(dir) {
        console.log('Images written to %s', dir);
        writeImageIndex(outpath, dir);
      });
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

function convertDocumentToImages(filepath) {
  const tmpDir = fs.mkdtempSync(`${IMAGES_DIR}/`);
  return new Promise(function(resolve, reject) {
    exec(`./pdf2pngs.sh "${filepath}" "${tmpDir}"`, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(tmpDir);
      }
    });
  });
}

function getImageIndexFile(docpath) {
  return `${docpath}.idx.json`;
}

function writeImageIndex(docpath, imgdir) {
  const imgfiles = fs.readdirSync(imgdir);
  const index = [];
  for(let i in imgfiles) {
    const imgfile = imgfiles[i];
    const pagenum = path.basename(imgfile).split('.')[0];
    index.push({
      page: parseInt(pagenum),
      file: `${imgdir}/${imgfile}`
    });
  }
  const indexContent = JSON.stringify(index);
  const indexFilepath = getImageIndexFile(docpath);
  fs.writeFileSync(indexFilepath, indexContent);
} 

function init() {
  if(!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR);
  }
  if(!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR);
  }
  if(!fs.existsSync(TILES_DIR)) {
    fs.mkdirSync(TILES_DIR);
  }
}

function start() {
  http.createServer(serve).listen(8080);
}

init();
start();
