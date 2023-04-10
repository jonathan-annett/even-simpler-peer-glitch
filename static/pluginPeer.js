/* global SimplePeer */

function pluginPeer(context,action) {


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
            peer.on('data', onData);
            peer.on('close',onClose);
            peer.on('error',onClose);
        }

        if (connected) {

            events.connect.forEach(function(fn) {
                fn();
            });

        } else {
            if (connected===false) {
                const closingPeer = peer;
                if (closingPeer) {
                    peer=undefined;
                    closingPeer.destroy();
                }
            }
        }

    }

    function onClose() {
        if (peer) {
            events.close.forEach(function(fn) {
                fn();
            });
            const closingPeer = peer;
            peer = undefined;
            closingPeer.destroy();
            $SD.sendToPropertyInspector(context,{closed:true},action);
        }
        
    }

    function onData(data) {
        if (peer) {
            try {

                const payload = JSON.parse(data);                
                events.data.forEach(function(fn) {
                    fn(payload);
                });
            } catch(e) {

            } 
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
            return peer.send(JSON.stringify(data));
        }
    }

    function peerClose() {
         onClose();
    }

}