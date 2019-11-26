import './scss/style.scss';
import mqtt from 'mqtt';
// Log message to console

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
    module.hot.accept(); // eslint-disable-line no-undef  
}

var room_id = localStorage.getItem('room_id');

if (room_id) {
    var url = `mqtt://${window.location.host.split(':')[0]}:1883`;
    var client = mqtt.connect(url);
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
        // message is Buffer
        console.log(message.toString());
        client.end();
    });
}

