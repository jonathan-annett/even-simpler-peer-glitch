/* global SimplePeer*/

function browserAppPeer(button, labels) {

    labels = labels || {
        copyOffer:   "Connect",
        pendingBlur : "click \"paste connection\" in streamdeck",
        pasteAnswer: "paste response",
        connected: "Disconnect"
    };

    let tempPeer, peer, offerJSON;

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

    tempPeer = createTempPeer(); 

    return self;

    function createTempPeer() {
        tempPeer = new SimplePeer({
            initiator: true,
            trickle: false,
            objectMode: false,
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
            navigator.clipboard.writeText(offerJSON).then(function() {
                offerJSON = undefined;
                setupButton(labels.pendingBlur, null);
                window.addEventListener('blur',tempBlur);              
            });
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

            peer.on('close', onClose);

            events.connect.forEach(function(fn){
                fn();
            });

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
        if (peer) {
            return peer.send(JSON.stringify(data));
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