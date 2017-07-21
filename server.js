// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var path = require("path");
//Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
//Scrapers
var request = require("request");
var cheerio = require("cheerio");


// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

//Set port
var port = process.env.PORT || 8080;

//Initialize express
var app = express();

//Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

//Make public a static dir
app.use(express.static(__dirname + "/public"));

//Setup handlebars engine
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// mongodb://heroku_vzlw8jc4:i89nilq5e2llu7786e71gi5bvj@ds115583.mlab.com:15583/heroku_vzlw8jc4
// mongodb://localhost/week18homework
mongoose.connect("mongodb://heroku_vzlw8jc4:i89nilq5e2llu7786e71gi5bvj@ds115583.mlab.com:15583/heroku_vzlw8jc4");
var db = mongoose.connection;

//Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});


//Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


//Routes

// A GET request to scrape the NY Times website
app.get("/scrape", function(req, res) {
  request("http://www.nytimes.com", function(error, response, html) {
    var $ = cheerio.load(html);
    var result = {};
    $("article.theme-summary").each(function(i, element) {
      var link = $(element).children("h2.story-heading").children("a").attr("href");
      var title = $(element).children("h2.story-heading").children().text().trim();
      var author = $(element).children('.byline').text();
      var summary = $(element).children('.summary').text().trim();

    //Verify the scrape successfully collected these elements
      if (link && title && author && summary) {
        result.link = link,
        result.title = title,
        result.author = author,
        result.summary = summary,
        result.saved = false
      }

      //Saves the passed articles in Articles collection
      var entry = new Article(result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err)
        }
        else {
          console.log(doc);
        }
      });

    });
  });
  res.send("/articles");
});

//First purges all articles from the database that are not saved
//then renders the index page with navbar and empty articles container
app.get("/", function(req, res) {
  Article.remove({saved:false}, function(error, removed) {
    if(error) {
      console.log(error);
      res.send(error);
    }
    else {
      console.log(removed);
      res.render("index");
      }
  });
});

//Route for the delete button in the Saved articles page.
//Changes articles saved boolean to false, so next time the "/" page loads
//the article is purged from the database with other "false" saved articles
app.post("/articles/delete/:id", function(req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id}, { "saved": false})
  .exec(function(err, doc) {
    if (err) {
      console.log(err)
    }
    else {
      res.send(doc);
    }
  });
});


//Query for all unsaved articles to render on the index page
app.get("/articles", function(req, res) {
  Article.find({saved: false}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {

      console.log("Length of the doc: "+ doc.length);
      res.render("index", { ars: doc });
    }
  });
});

//Query to find all saved articles to render on the saved page
app.get("/saved", function(req, res) {
  Article.find({saved: true}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.render("saved", { ars: doc });
    }
  });
});


//Route for the comment button on the Saved page - fetches all notes associated with an article
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

//Route for save button on the index page - fetches the selected article and updates "saved" to true
app.post("/articles/saved/:id", function(req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id}, { "saved": true})
  .exec(function(err, doc) {
    if (err) {
      console.log(err)
    }
    else {
      res.send(doc);
    }
  });
});

//Save a new note to the database with an id associated with its article
app.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);

  newNote.save(function(error, doc) {

    if (error) {
      console.log(error);
    }
    else {
      // Find our user and push the new note id into the User's notes array
      Article.findOneAndUpdate({"_id": req.params.id}, { $push: { "note": doc._id } }, { new: true }, function(err, newdoc) {
        // Send any errors to the browser
        if (err) {
          res.send(err);
        }
        // Or send the newdoc to the browser
        else {
          res.send(newdoc);
        }
      });
    }
  });
});

app.listen(port, function() {
  console.log("App running on port", port);
})
