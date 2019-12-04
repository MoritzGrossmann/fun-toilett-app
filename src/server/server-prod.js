import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../../webpack.dev.config.js';
import https from 'https';
import fs from 'fs';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const app = express(),
  DIST_DIR = __dirname,
  HTML_FILE = path.join(DIST_DIR, 'index.html'),
  DB_FILE = path.join('/var/toilett_app', 'db.json'),
  TOILETT_TABLE = "toiletts",
  compiler = webpack(config);

const adapter = new FileSync(DB_FILE);
const db = low(adapter);

db.defaults({ toiletts: [], user: {}, count: 0 })
  .write();

app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
}));

app.use(webpackHotMiddleware(compiler));

app.use(express.json());

app.use(express.static('public'));

app.get('/api/toilett', (req, res) => {
  var toiletts = db
    .get(TOILETT_TABLE)
    .value();
  console.log(toiletts);
  res.json(toiletts);
});

app.post('/api/toilett', (req, res) => {
  var toilett = req.body;
  console.log(toilett);
  db.get('toiletts')
    .push(toilett)
    .write();
  res.sendStatus(201);
});

app.get('/', (req, res, next) => {
  compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
    if (err) {
      return next(err);
    }
    res.set('content-type', 'text/html');
    res.send(result);
    res.end();
  });
});


const PORT = process.env.PORT || 8080;

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app)
  .listen(PORT, function () {
    console.log(`App listening to ${PORT}....`);
    console.log('Press Ctrl+C to quit.');
  });
