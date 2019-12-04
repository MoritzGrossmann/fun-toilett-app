import './scss/style.scss';
import mqtt from 'mqtt';
import ko from "knockout";
import { api } from './js/api';
// Log message to console

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
    module.hot.accept(); // eslint-disable-line no-undef  
}

var room_id = localStorage.getItem('room_id');

window.mqtturl = `mqtt://${window.location.host.split(':')[0]}:1884`;
var mqttclient = mqtt.connect(window.mqtturl, {
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
});

var viewModel = function (mqttclient, room) {
    var self = this;
    self.choosenRoom = ko.observable(room);

    self.rooms = ko.observableArray();

    self.join = function (room) {
        console.log(`connecting to toilett ${room}...`);
        mqttclient.subscribe(`toilett/${room}`);
        console.log(`connected`);
    };

    self.loadToiletts = function () {
        self.rooms = ko.observableArray([]);
        api.get('toilett').then(response => {
            response.data.forEach(t => {
                self.rooms.push(t);
            });
        });
    };

    mqttclient.on('message', function (topic, message) {
        var index = topic.split('/')[1];

        var toilett = self.rooms()[index];
        var frei = parseInt(message.toString()) === 0;

        if (toilett) {
            var text = `${toilett.name} ist jetzt ${frei ? 'frei' : 'besetzt'}`;

            new Notification("Toilettenapp", { body: text, icon: frei ? '/icons/free.png' : '/icons/occupied.png' });
            console.log(message.toString());
        } else {
            console.warn(`toilette ${index} wurde nicht gefunden`);
        }
    });

    self.loadToiletts();

    if (room) self.join(self.choosenRoom());
};

ko.applyBindings(new viewModel(mqttclient, room_id));
