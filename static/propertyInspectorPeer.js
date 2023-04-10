/* global SimplePeer*/
 
function propertyInspectorPeer(button, action,context, uuid, labels) {


    let peer, answer1;

    labels = labels || {
        pasteOffer:  "Connect",
        copyAnswer:  "copy connection response",
        pendingBlur: "click \"paste response\" in browser",
        connected: "Disconnect"
    };
    
    

    $PI.onSendToPropertyInspector(uuid,onSendToPi);

    setupButton(labels.pasteOffer, pasteOfferClickEvent);

    function pasteOfferClickEvent(ev) {

        navigator.clipboard.readText().then(function(signalb64) {
            let failed = true;
            try {

                const signalData = JSON.parse(atob(signalb64));

                if (signalData && signalData.type === "offer") {
                    failed = false;
                    if (peer) {
                        peer.destroy();
                    }
                    peer = new SimplePeer({
                        initiator: false,
                        trickle: false,
                        objectMode: false
                    });
                    peer.signal(signalData);
                    peer.on('signal',function(answer) {
                        answer1 = answer;
                        setupButton(labels.copyAnswer, copyAnswerClickEvent);
                        copyAnswerClickEvent(ev);
                    });

                    peer.on('connect', onConnect);
                    peer.on('close', onClose);

                }

            } catch (e) {

            } finally {
                if (failed) {
                    alert("please click Connect in the browser app first");
                }
            }

        }).catch(function(x){

        });

    }

    function setupButton(label, clickEvent) {
        button.onclick = null;
        button.value = label;
        button.innerHTML = label;
        button.onclick = clickEvent;
        button.disabled = !!!clickEvent;
    }

    function copyAnswerClickEvent(ev) {
        if (answer1) {

            navigator.clipboard.writeText(btoa(JSON.stringify(answer1))).then(function() {

               setupButton(labels.pendingBlur, null);
               

            });
        }
    }
 
    function onConnect() {
        if (peer) {
            peer.on('data', onData);
            setupButton(labels.connected, forceClose);
            $PI.sendToPlugin({
                "action": action,
                "event": "sendToPlugin",
                "context": context,
                "payload" : {
                   connected: true
                }
            });
        }
    }

    function forceClose () {
        $PI.sendToPlugin({
            "action": action,
            "event": "sendToPlugin",
            "context": context,
            "payload" : {
               connected: false
            }
        });  
        setupButton(labels.connected, null);
    }

    function onClose() {
        let closingPeer = peer;
        peer = undefined;
        if (closingPeer) {
            closingPeer.destroy();
        }

    }

    function onData(data) {
        if (peer) {
            try {
                $PI.sendToPlugin({
                    "action": action,
                    "event": "sendToPlugin",
                    "context": context,
                    "payload" : {
                        offer: JSON.parse(data)
                    }
                });
            }
            catch(e) {

            }
        }
    }

    function onSendToPi({payload}) {
        const {
            answer,
            closed
        } = payload || {};
        if (answer) {
            peer.send(JSON.stringify(answer));
        }

        if (closed) {
            setupButton(labels.pasteOffer, pasteOfferClickEvent);
        }
    }

}