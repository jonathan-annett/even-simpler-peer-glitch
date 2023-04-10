/* global SimplePeer*/

function browserAppPeer(button, labels) {

    labels = labels || {
        copyOffer: "copy offer",
        pasteAnswer: "paste answer",
        connected: "(connected)"
    };

    let tempPeer, peer, offer;

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

    tempPeer = new SimplePeer({
        initiator: true,
        trickle: false,
        objectMode: false,
    });

    tempPeer.on('signal', function(signalData) {
        offer = signalData;
        setupButton(labels.copyOffer, copyOfferClickEvent);
    });

    return self;


    function setupButton(label, clickEvent) {
        button.onclick = null;
        button.value = label;
        button.innerHTML = label;
        button.onclick = clickEvent;
        button.disabled = !!!clickEvent;
    }

    function copyOfferClickEvent(ev) {
        if (offer) {
            navigator.clipboard.writeText(btoa(JSON.stringify(offer))).then(function() {
                offer = undefined;
                setupButton(labels.pasteAnswer, pasteAnswerClickEvent);
            });
        }
    }

    function pasteAnswerClickEvent(ev) {
        navigator.clipboard.readText().then(function(signalb64) {
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
            events.close.splice(0, events.close.length);
            events.connect.splice(0, events.connect.length);
            events.data.splice(0, events.data.length);
            const closingPeer = peer;
            peer = undefined;
            closingPeer.destroy();

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
        const closingPeer = peer;
        peer = undefined;
        if (closingPeer) {
            closingPeer.destroy();
        }
    }


}