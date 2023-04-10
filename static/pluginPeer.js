/* global SimplePeer */

function pluginPeer() {


    let peer;
    const events = {
        data: [],
        connect: [],
        close: []
    },
    self = {
        on: peerAddListener,
        off: peerRemoveListener,
        send: peerSend,
        close: peerClose
    };

    $SD.onSendToPlugin(onSendToPlugin);

    return self;

    function onSendToPlugin({action, context, payload}) {
         const {
            offer, connected
        } = payload || {};

        if (offer) {
            if (peer) peer.destroy();
            peer = new SimplePeer({
                initiator: false,
                trickle: false,
                objectMode: false
            });
            peer.signal(offer);
            peer.on('signal',function(answer) {
                $SD.sendToPropertyInspector(context,{answer:answer},action);
            });
            peer.on('data', function(data) {
                events.data.forEach(function(fn) {
                    fn(data);
                });
            });
            peer.on('close', function(data) {
                events.close.forEach(function(fn) {
                    fn();
                });
                if (peer) {
                    peer.destroy();
                }
                events.close.splice(0, events.close.length);
                events.data.splice(0, events.data.length);
                events.connect.splice(0, events.connect.length);
            });
        }

        if (connected) {

            events.connect.forEach(function(fn) {
                fn();
            });
        }

    }

    function peerAddListener(e, fn) {

        if (typeof e + typeof fn === 'stringfunction') {
            const stack = events[e];
            if (stack) {
                const ix = stack.indexOf(fn);
                if (ix < 0) {
                    stack.push(fn);
                }
            }
        }
    }

    function peerRemoveListener(e, fn) {
        if (typeof e + typeof fn === 'stringfunction') {
            const stack = events[e];
            if (stack) {
                const ix = stack.indexOf(fn);
                if (ix >= 0) {
                    stack.slice(fn, 1);
                }
            }
        }
    }

    function peerSend(data) {
        if (peer) {
            return peer.send(data);
        }
    }

    function peerClose() {
        const closingPeer = peer;
        peer = undefined;
        if (closingPeer) {
            closingPeer.destroy();
        }
    }

}