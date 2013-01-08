
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , util = require('util')
  , xml2js = require('xml2js')
  , XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest  
  , OAuth= require('oauth').OAuth
  , Twit = require('twit')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

var app = express();

var consumer  = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	"uFwcgQHpjJcK39dLs0j7A",
	"iwuwS2RFIKnlafeBZDMpQNA4jTT1meopZIN9MkxC4",
	"1.0",
	"http://127.0.0.1:3000/sessions/callback",
	"HMAC-SHA1"
);

var T = new Twit({
    consumer_key:         'uFwcgQHpjJcK39dLs0j7A'
  , consumer_secret:      'iwuwS2RFIKnlafeBZDMpQNA4jTT1meopZIN9MkxC4'
  , access_token:         '1058159286-e0MqHZy8jv62jJKpSsYEIC8dVgWF2X4sp1jeIgu'
  , access_token_secret:  'C54QoRXodEPhhPlIEVXSFZ96pwkaceZaa4JAUsNqkQ'
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(path.join(__dirname, 'public'))); 
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('secret'));
  app.use(express.session());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  
  app.use(function(req, res, next){
    res.locals.user = req.session.user;
    next();
  });
  
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.get('/', routes.index);

app.get('/sessions/connect', function(req, res){
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token : " + util.inspect(error), 500);
    } else {  
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);      
    }
  });
});

app.get('/sessions/callback', function(req, res){
  util.puts(">>"+req.session.oauthRequestToken);
  util.puts(">>"+req.session.oauthRequestTokenSecret);
  util.puts(">>"+req.query.oauth_verifier);
  consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + util.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+util.inspect(results)+"]", 500);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      
      res.redirect('/home');
    }
  });
});

app.get('/home', function(req, res){
    consumer.get("http://api.twitter.com/1/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
      if (error) {
		console.log(error);
		res.redirect('/');
	  } else {
          var parsedData = JSON.parse(data);
          var xmlData = '';
          
          res.render('home', {
            title : 'Twitter Stock Dashboard',
            user : parsedData.screen_name,
            profileImg : parsedData.profile_image_url_https, 
            result: xmlData
          })
          
      } 
    });
});

app.get('/search', function(req, res){  
  if(req.method === "GET") {
    var stockSymbol = req.query["stockSymbol"];       
    var xmlData = "";
    
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      util.puts("State: " + this.readyState);            
      if (this.readyState == 4) {
        util.puts("Complete.\nBody length: " + this.responseText.length);
        xmlData = this.responseText;
                
        res.send(xmlData);          
      }  
    }                                          
    xhr.open("GET", "http://www.google.com/ig/api?stock="+stockSymbol);
    xhr.send();
	//T.get('search/tweets', { q: 'stockSymbol since:2011-11-11' }, function(err, reply) {
		//  ...
	//});
  } 
});

app.get('*', function(req, res){
    res.redirect('/home');
});