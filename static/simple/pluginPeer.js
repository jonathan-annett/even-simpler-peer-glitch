/* global SimplePeer */

function pluginPeer(SDApi) {


    let peer,peer_connected = false;
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

    Object.defineProperties(self, {
        connected: {    
            get: function() {
                return peer ? peer_connected : false;
            },
            enumerable: true,
            configurable: false
        }   
    
    });

    SDApi.onSendToPlugin(onSendToPlugin);

    return self;

    function onSendToPlugin(payload) {
         const {
            offer, close
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
                SDApi.sendToPropertyInspector({answer:answer});
            });
            peer.on('connect', onConnect);
            peer.on('data', onData);
            peer.on('close',onClose);
            peer.on('error',onClose);
        }

        
        if (close) {
            onClose();
        }
        

    }

    function onConnect() {
       
        events.connect.forEach(function(fn) {
            fn();
        });
    
        peer_connected = true;
         
    }

    function onClose() {
        if (peer) {
            events.close.forEach(function(fn) {
                fn();
            });
            const closingPeer = peer;
            peer = undefined;
            closingPeer.destroy();
            SDApi.sendToPropertyInspector({closed:true});
        }
        peer_connected = false;
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
        if (peer && peer_connected) {
            return peer.send(JSON.stringify(data));
        }
    }

    function peerClose() {
         onClose();
    }

}

function SDApi ($SD,context, action) {
    return  {
        onSendToPlugin: function(fn){
            return myAction.onSendToPlugin(fn);
        },
        sendToPropertyInspector:function(payload) {
            return $SD.sendToPropertyInspector(context, payload, action );
        }	
    };
}
