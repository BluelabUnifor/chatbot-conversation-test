var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var app = express();
var contexid = "";

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var conversation_id = "";
var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || '2608e252-43c2-43f8-9a03-021630bea063',
    password: process.env.CONVERSATION_PASSWORD || '32JDAVFQa3uI',
    version: 'v1',
    version_date: '2016-07-11'
});
var workspace = process.env.WORKSPACE_ID || 'workspaceId';

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'EAAXpBo8hNmABAPNgaGOIOu1CLjMZB25ZC6komfO9MypAcZBeGMN5dkhCqz5JpF7xiqWPmmaXvKBowqAiP4TufHoPiOQp2yZBJFK1OIpQInS3CjjdSlMyAFaZABodpeGYeY1rYruZCaiGr5v7ZBGyksgZAIO3WEtaELPWUZBjj1swZAtAZDZD') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Erro de validação no token.');
});

app.post('/webhook/', function (req, res) {
	var text = null;

    messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}

		var params = {
			input: text,
			// context: {"conversation_id": conversation_id}
			context:contexid
		}

		var payload = {
			workspace_id: "22318423-6194-487c-b5b6-f7f673b32175"
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
		 console.log(convResults);
		contexid = convResults.context;

        if (err) {
            return responseToRequest.send("Erro.");
        }

		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){


        if(typeof convResults.output.button !== 'undefined'){
          sendButtonMessage(sender, convResults.output.text[i++], JSON.stringify(convResults.output.button));
        }else if(typeof convResults.output.quick_replie !== 'undefined') {
        	sendToppicsMessage(sender, JSON.stringify(convResults.output.quick_replie));
        }else {
//          sendMessage(sender, convResults.output.text[i++]);
          sendToppicsMessage(sender);
          i++;
        }
        

			}
		}

    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

function sendButtonMessage(recipient, text ,button) {

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:recipient},
      message: {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":text,
            "buttons":button
          }
        }
      }
    }
  },

  function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
};

function sendToppicsMessage(recipient, quick_replie) {

console.log(recipient)
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:recipient},
     	message: {
			"text": "Pick a color:",
			"quick_replies": quick_replie
		}
    }
  },

  function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
};

var token = "EAAXpBo8hNmABAPNgaGOIOu1CLjMZB25ZC6komfO9MypAcZBeGMN5dkhCqz5JpF7xiqWPmmaXvKBowqAiP4TufHoPiOQp2yZBJFK1OIpQInS3CjjdSlMyAFaZABodpeGYeY1rYruZCaiGr5v7ZBGyksgZAIO3WEtaELPWUZBjj1swZAtAZDZD";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);
