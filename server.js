const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))


/****************** <JANNDEN> ****************/

// Connection
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;

// Get Index File if there is a successful DB connection
app.get('/', (req, res) => {
  if (mongoose.connection.readyState == 1) {
    res.sendFile(__dirname + '/views/index.html')
  } else {
    res.json({ error: 'Not connected to DB, error ' + mongoose.connection.readyState });
  }
});

// Creating DBs
const personSchema = new Schema({
  username: {type: String, unique: true}
});
const PersonModel = mongoose.model("person", personSchema);

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});
const ExerciseModel = mongoose.model("exercise", exerciseSchema);

// API
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// New User
app.post("/api/exercise/new-user", function (req, res) {
  PersonModel.findOne({username: req.body.username}, (err, data) => {
    if(err) {
      res.json({ error: err });
    } else if(!data) {
      const newUser = new PersonModel({ username: req.body.username });
      newUser.save((err, data) => {
        if (err) {
          res.json({ error: err });
        } else {
          res.json({
            username: data.username,
            _id: data._id
          });
        }
      })
    } else {
      res.send("User Exists, id = "+data.id);
    }
  })
});

// Users Log
app.get("/api/exercise/users", function (req, res) {
  PersonModel.find({}, (err, personData) => {
    if (!personData || err) {
      res.send("DB empty");
    } else {
      res.json(personData);
    }
  })
});

// New Exercise
app.post("/api/exercise/add", function (req, res) {
  PersonModel.findById(req.body.userId, (err, personData) => {
    if (!personData || err) {
      res.send("Unknown userId");;
    } else {
      if(req.body.userId == "" || req.body.userId == "" || req.body.userId == "") {
        res.json({ error: "Supply userId, description, duration" });
      }
      if(!req.body.date) req.body.date = new Date();
      const newExercise = new ExerciseModel({
        userId: req.body.userId,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      });
      newExercise.save((err, exerciseData) => {
        if (err) {
          console.log("error", err);
          res.json({ error: err });
        } else {
          res.json({
            _id: req.body.userId,
            username: personData.username,
            date: new Date(exerciseData.date).toDateString(),
            duration: exerciseData.duration,
            description: exerciseData.description
          });
        }
      })
    }
  })
});

// Exercise Log
app.get("/api/exercise/log", function (req, res) {
  console.log("req.query", req.query);
  PersonModel.findById(req.query.userId, (err, personData) => {
    if(!personData) {
      res.send("Unknown userId");
    } else {
      if(!req.query.from && !req.query.to) {
        searchJson = {userId : req.query.userId};
      } else {
        searchJson = {
        userId : req.query.userId,
        date: {
            $gte: new Date(req.query.from),
            $lte: new Date(req.query.to)
          }
        };
      }
      if(!req.query.limit) req.query.limit = 100;
      ExerciseModel.find(searchJson)
      .select(["id","description","duration","date"])
      .limit(+req.query.limit)
      .exec((err, exerciseData) => {
        if(!exerciseData) {
          output = {
            "userId": req.query.userId,
            "username": personData.username,
            "count": 0,
            "log": []
          };
        } else {
          output = {
            "userId": req.query.userId,
            "username": personData.username,
            "count": exerciseData.length,
            "log": exerciseData
          };
          
        }
        console.log("output", output);
        res.json(output);
      })
    }
  });
});

/****************** </JANNDEN> ****************/


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
