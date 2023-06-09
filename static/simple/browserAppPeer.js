/* global SimplePeer*/

function browserAppPeer(button, labels) {

    labels = labels || {
        copyOffer:   "Connect",
        pendingBlur : "click \"Connect\" in streamdeck",
        pasteAnswer: "paste response",
        connected: "Disconnect"
    };

    let tempPeer, peer, peer_connected, offerJSON,clipboardBackup;

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

    tempPeer = createTempPeer(); 

    return self;

    function sha256Hash(message, cb) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        crypto.subtle.digest("SHA-256", data).then(function (digestBuffer) {

            cb(undefined, {
                input: message,
                hex: Array.from(new Uint8Array(digestBuffer))
                    .map(function (b) {
                        return b.toString(16).padStart(2, "0");
                    }
                    )
                    .join(""),

                buffer: digestBuffer
            });
        }).catch(cb);
         
    }

    function alwaysSDP(sdp){

        const sdp2 = sdp.replace(/t=.*(?=(\r|\n))/g,'t=0 0');

        const sdp3 = sdp2.replace(/a=ice-ufrag\:.*(?=(\r|\n))/g,'');
        const sdp4 = sdp3.replace(/a=ice-pwd\:.*(?=(\r|\n))/g,'');
        const sdp5 = sdp4.replace(/a=fingerprint\:sha-256.*(?=(\r|\n))/g,'');

        
        const sdp6 = sdp5.replace(/\s*/g,'');

        sha256Hash(sdp6,function(err,digest){
            console.log({sdp:sdp2.split('\r\n'),sdp5:sdp5.split('\r\n'),hash:digest.hex});
        });
        
      

        return sdp2;
        
    }

    function createTempPeer() {
        tempPeer = new SimplePeer({
            initiator: true,
            trickle: false,
            objectMode: false,
            sdpTransform : alwaysSDP
        });
    
        tempPeer.on('signal', function(signalData) {
            offerJSON = btoa(JSON.stringify(signalData)) ;
            setupButton(labels.copyOffer, copyOfferClickEvent);
        }); 
        return tempPeer;   
    }


    function setupButton(label, clickEvent) {
        button.onclick = null;
        button.value = label;
        button.innerHTML = label;
        button.onclick = clickEvent;
        button.disabled = !!!clickEvent;
    }

    function copyOfferClickEvent(ev) {
        if (offerJSON) {

            clipboardBackup=undefined;
            navigator.clipboard.read().then(function(whatever) {
                clipboardBackup=whatever;
                continueRegardless();
            }).catch(continueRegardless);


            function continueRegardless(){

                navigator.clipboard.writeText(offerJSON).then(function() {
                    setupButton(labels.pendingBlur, null);
                    window.addEventListener('blur',tempBlur);              
                });
            }
        }
    }
 
    function tempBlur() {
        setupButton(labels.pasteAnswer, pasteAnswerClickEvent);
        window.removeEventListener('blur',tempBlur);
    }

    function pasteAnswerClickEvent(ev) {
        navigator.clipboard.readText().then(function(signalb64) {

            if (signalb64===offerJSON) {
                window.addEventListener('blur',tempBlur);
                return alert (labels.pendingBlur);
            }
            try {

                const signalData = JSON.parse(atob(signalb64));

                if (signalData && signalData.type === "answer") {
                    tempPeer.signal(signalData);
                    tempPeer.on('connect', onTempConnect);
                    tempPeer.on('data',onTempData);

                }  

            } catch (e) {
                if (clipboardBackup) {
                    navigator.clipboard.write(clipboardBackup).then(function() {
                        clipboardBackup=undefined;
                    }).catch(function(){ clipboardBackup=undefined;});
                }
            }

            if (clipboardBackup) {
                navigator.clipboard.write(clipboardBackup).then(function() {
                    clipboardBackup=undefined;
                }).catch(function(){ clipboardBackup=undefined;});
            }
        });
    }

    function onTempConnect() {
        if (tempPeer) {
            const alreadyConnected = peer;
            if (alreadyConnected) {
                peer = undefined;
                alreadyConnected.destroy();
            }

            peer = new SimplePeer({
                initiator: true,
                trickle: false,
                objectMode: false,
            });

            peer.on('signal', function(signalData) {
                tempPeer.send(JSON.stringify(signalData));
            });

            peer.on('connect', onConnect);

               

        }
    }

    function onTempData (data) {
        if (peer) {
            try {
                peer.signal(JSON.parse(data));
            } catch (e) {

            }
        }
    }

    function onConnect() {
        if (peer) {
            peer.on('data', onData);
            const closingTemp = tempPeer;
            if (closingTemp) {
                tempPeer = undefined;
                closingTemp.destroy();
            }

            peer.on('close',onClose);
            peer.on('error',onClose);
       
            events.connect.forEach(function(fn){
                fn();
            });

            peer_connected = true;

            setupButton(labels.connected, peerClose);

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

    function onClose() {
        if (peer) {
            events.close.forEach(function(fn) {
                fn();
            });
            const closingPeer = peer;
            peer = undefined;
            closingPeer.destroy();
        }
        peer_connected = false;
        tempPeer = createTempPeer(); 
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