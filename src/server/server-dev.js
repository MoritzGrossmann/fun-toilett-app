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
import mosca from 'mosca';

const app = express(),
  DIST_DIR = __dirname,
  // eslint-disable-next-line no-unused-vars
  PUBLIC_DIR = path.join(DIST_DIR, 'public'),
  HTML_FILE = path.join(DIST_DIR, 'index.html'),
  DB_FILE = path.join(__dirname, 'db.json'),
  MQTT_PORT = 1883,
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

app.get('/api/toilett', (req, res) => {
  var toiletts = db
    .get(TOILETT_TABLE)
    .value();
  res.json(toiletts);
});

app.post('/api/toilett', (req, res) => {
  var toilett = req.body;
  console.log(`new Toilett: ${toilett}`);
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

/* ####### MQTT Server ######### */


// eslint-disable-next-line no-unused-vars
var settings = {
  http: {
    port: 1884,
    bundle: true,
    static: './'
  }
};

var server = new mosca.Server(settings);


server.on('clientConnected', function (client) {
  console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function (packet) {
  console.log('Packet', packet);

  db.get(TOILETT_TABLE)
    .find({ id: parseInt(packet.topic) })
    .assign({ 'occupied': packet.payload })
    .write();

  var toilett = db.get(TOILETT_TABLE[parseInt(packet.topic)])
    .value();

  console.log("toilett", toilett);
});

server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
  console.log(`Mosca server is up and running on Port ${MQTT_PORT}`);
}