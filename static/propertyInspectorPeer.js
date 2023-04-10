/* global SimplePeer*/
 
function propertyInspectorPeer(button, action,context, uuid, labels) {


    let peer, answer1;

    labels = labels || {
        pasteOffer: "paste offer",
        copyAnswer: "copy answer",
        connected: "(connected)"
    };
    
    

    $PI.onSendToPropertyInspector(uuid,onSendToPi);

    setupButton(labels.pasteOffer, pasteOfferClickEvent);

    function pasteOfferClickEvent(ev) {

        navigator.clipboard.readText().then(function(signalb64) {
            try {

                const signalData = JSON.parse(atob(signalb64));

                if (signalData && signalData.type === "offer") {
                    if (peer) {
                        peer.destroy();
                    }
                    peer = new SimplePeer({
                        initiator: false,
                        trickle: false,
                        objectMode: false
                    });
                    peer.signal(signalData);
                    peer.onSignal(function(answer) {
                        answer1 = answer;
                        setupButton(labels.copyAnswer, copyAnswerClickEvent);
                        copyAnswerClickEvent(ev);
                    });

                    peer.on('connect', onConnect);
                    peer.on('close', onClose);

                }

            } catch (e) {

            }
        });

    }

    function setupButton(label, clickEvent) {
        button.onclick = null;
        button.value = label;
        button.innerHTML = label;
        button.onclick = clickEvent;
    }

    function copyAnswerClickEvent(ev) {
        if (answer1) {

            navigator.clipboard.writeText(btoa(JSON.stringify(answer1))).then(function() {
                setupButton(labels.connected, null);
            });
        }
    }


    function onConnect() {
        if (peer) {
            peer.on('data', onData);
        }
    }

    function onClose() {
        let closingPeer = peer;
        peer = undefined;
        if (closingPeer) {
            $PI.sendToPlugin({
                "action": action,
                "event": "sendToPlugin",
                "context": context,
                "payload" : {
                   connected: true
                }
            });
            closingPeer.destroy();
        }

    }

    function onData(offer) {
        if (peer) {
             $PI.sendToPlugin({
                "action": action,
                "event": "sendToPlugin",
                "context": context,
                "payload" : {
                    offer: offer
                }
            });
        }
    }

    function onSendToPi({payload}) {
        const {
            answer
        } = payload || {};
        if (answer) {
            peer.send(answer);
        }
    }

}