var http = require('http')
  , process_group = 'node'
  , process_user = 'node'
  , redis = require("redis")
  , redisClient = redis.createClient(process.env.REDISPORT, process.env.HOST)
  , fs = require('fs')
  , moment = require('moment')
  , Cookies = require('cookies')
  , refererurl = process.env.REFERERURL
  , url = require('url');

// This drops Root privileges, uncomment if you run this behind a proxy
function dropRootPrivileges() {
  try {
    console.log('Giving up root privileges...');
    process.setgid(process_group);
    process.setuid(process_user);
    console.log('New uid: ' + process.getuid());
  }
  catch (err) {
    console.log('Failed to drop root privileges: ' + err);
    throw err;
  }
}

// Connect to redis db
redisClient.auth(process.env.REDISSECRET, function(err) {
    if(err){console.log(new Date() + err);}
});

// Read the pixel gif from disk and cache in memory
var thepixel = fs.readFileSync(__dirname + '/pixel.gif');

// Helper function for calculating cookie expiration time
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}

function servePixel (req, res) {
  var cookies = new Cookies(req, res)
    , now = new Date()
    , time = {}
    , nowmoment = moment();
  time.year = now.getUTCFullYear();
  time.month = now.getUTCMonth() + 1;
  time.day = now.getUTCDate();
  time.week = nowmoment.week();

  // Only count page impressions and visits if referer url is correct
  if(req.headers.referer &&
     url.parse(req.headers.referer).host === refererurl) {
    redisMulti = redisClient.multi();
    redisMulti.incr('pis-by-day:' + time.year + '-' + time.month + '-' + time.day);
    redisMulti.incr('pis-by-week:' + time.year + '-kw' + time.week);
    redisMulti.incr('pis-by-month:' + time.year + '-' + time.month);

    // Only count visits if no valid cookie is present
    if(!cookies.get("visited")) {
      redisMulti.incr('visits-by-day:' + time.year + '-' + time.month + '-' + time.day);
      redisMulti.incr('visits-by-month:' + time.year + '-' + time.month);
      redisMulti.incr('visits-by-week:' + time.year + '-kw' + time.week);
    }
    // Set new cookie, expiring 30 minutes from now
    cookies.set("visited", now, {expires:addMinutes(now, 30)});

    // Write everything to Redis
    redisMulti.exec();
  }

  // console.log(req.connection.remoteAddress);
  res.writeHead(200, {'Content-Type': 'image/gif' });
  res.end(thepixel, 'binary');
}

http.createServer(servePixel).listen(process.env.PORT, dropRootPrivileges);
