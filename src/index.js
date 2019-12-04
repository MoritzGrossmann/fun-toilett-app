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

    self.connections = ko.observableArray([]);

    self.chooseRoom = function (room) {
        self.choosenRoom(room);
        self.subscribe(room.id);
    };

    self.unchooseRoom = function (room) {
        self.choosenRoom(null);
        localStorage.removeItem('room_id');
        self.unsubscribe(room.id);
    };

    self.test = function () {
        console.log("test...");
    };

    self.choosenRoom = ko.observable(room);

    self.rooms = ko.observableArray();

    self.subscribe = function (room) {
        self.connections().forEach(r => {
            self.unsubscribe(r);
        });

        console.log(`connecting to toilett ${room}...`);
        mqttclient.subscribe(`toilett/${room}`);
        self.connections.push(room);
        console.log(`connected`);

        localStorage.setItem('room_id', room);
    };

    self.unsubscribe = function (room) {
        console.log(`unsubscribe toilett ${room}`);
        mqttclient.unsubscribe(`toilett/${room}`);
        self.connections.remove(room);
        console.log(`unsubscribed`);
    };

    self.loadToiletts = function () {
        self.rooms = ko.observableArray([]);
        api.get('toilett').then(response => {
            response.data.forEach(t => {
                if (room && t.id === parseInt(room)) {
                    self.choosenRoom(t);
                }
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

            self.rooms.replace(toilett, { id: toilett.id, name: toilett.name, occupied: !frei });

            console.log(message.toString());
        } else {
            console.warn(`toilette ${index} wurde nicht gefunden`);
        }
    });

    self.loadToiletts();

    if (room) self.subscribe(self.choosenRoom());
};

var checkNotifications = function () {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            console.log(`Notification-permissions: ${permission}`);
        });
    }
};

checkNotifications();

ko.applyBindings(new viewModel(mqttclient, room_id));
