import './scss/style.scss';
import mqtt from 'mqtt';
// Log message to console

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
    module.hot.accept(); // eslint-disable-line no-undef  
}

var room_id = localStorage.getItem('room_id');

if (room_id) {
    window.mqtt = mqtt;
    var url = `mqtt://${window.location.host.split(':')[0]}:1884`;
    var client = mqtt.connect(url, {
        clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),

    });
    client.subscribe(`toilett/${room_id}`);
    window.mqttclient = client;
    console.log(`connected to Room ${room_id}`);

    client.on('connect', function () {
        client.subscribe('presence', function (err) {
            if (!err) {
                client.publish('presence', 'Hello mqtt');
            }
        });
    });

    client.on('message', function (topic, message) {
        new Notification("Toilettenapp", { body: message.toString() });
        console.log(message.toString());
    });
}

