var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Event = require('../models/Event.js');
var Comment = require('../models/Comment.js');
var mailer = require('../services/mailer.js');
var User = require('../models/User.js');


router.get('/', function(req, res) {
    var date = new Date().toISOString();
    Event.find({ 'date' : { $gte : date}}).sort({date: 'ascending'})
        .exec(function(err, events) {
            res.status(200).json(events);
        });
});

router.post('/', function(req, res) {
    var event = new Event(req.body);
    event.nbComment = 0;
    event.state = "pending";

    event.save(function(err, event) {
        User.findById(event.creatorId, function(err, user) {
            var subject = "Votre evenement ["+ event.title + "] est en cours de validation";
            var body = "Bonjour " + user.name.first + ",";
            body += "<p>Votre évenement <b>" + event.title + "</b> est en cours de validation par nos équipes.";
            body += "<br/> Vous recevrez un mail lorsque notre équipe l'aura validé.";
            body += "<br/> Merci de votre confiance.";
            body += "<br/><br/> L'équipe GameSwap.";
            mailer.sendMail(user.email, subject, body, function() {
                res.json(200, event);                
            });
        });
    });
});

router.get('/:id', function(req, res) {
    Event.findById(req.params.id, function(err, event) {
        res.json(200, event);
    });
});

router.put('/:id', function(req, res) {
    Event.findById(req.params.id, function(err, event) {
        event.title = req.body.title;
        event.descript = req.body.descript;
        event.save(function(err, event) {
            res.json(200, event);
        });
    });
});

router.delete('/:id', function(req, res) {
    Event.findById(req.params.id, function(err, event) {
        event.remove(function(err, event) {
            res.json(200, {
                msg: 'OK'
            });
        });
    });
});

// NESTED (Comment)
router.get('/:id/comments', function(req, res) {
    // Get all comments for the event
    Comment.find({
        eventId: req.params.id
    }, function(err, comments) {
        res.status(200).json(comments);
    });
});

router.post('/comments', function(req, res) {
    // Add comment for the post
    var comment = new Comment(req.body);
    comment.save(function(err) {
        var eventId = comment.eventId;
        Event.findById(eventId, function(err, event) {
            event.nbComment = event.nbComment++;
            event.save(function(err, event) {
                res.json(200, event);
            });
        });
    });
});

router.delete('/comments/:id', function(req, res) {
    // Delete comment
    Comment.findById(req.params.id, function(err, comment) {
        comment.remove(function(err, comment) {
            res.json(200, {
                msg: 'OK'
            });
        });
    });
})


module.exports = router;