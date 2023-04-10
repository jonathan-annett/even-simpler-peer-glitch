/* global SimplePeer*/
 
function propertyInspectorPeer(button, action,context, uuid, PIApi, labels) {


    let peer, answer1;

    labels = labels || {
        pasteOffer:  "Connect",
        copyAnswer:  "copy connection response",
        pendingBlur: "click \"paste response\" in browser",
        connected: "Disconnect"
    };
    
    

    PIApi.onSendToPropertyInspector(onSendToPi);

    setupButton(labels.pasteOffer, pasteOfferClickEvent);

    function pasteOfferClickEvent(ev) {

        ev.preventDefault();
        ev.stopPropagation();
        navigator.permissions.query({name: "clipboard-write"}).then((result) => {
            console.log(result);
            if (result.state === "granted" || result.state === "prompt") {
              /* write to the clipboard now */
              console.log("write ok");
            }
          });

          navigator.permissions.query({name: "clipboard-read"}).then((result) => {
            console.log(result);
            if (result.state === "granted" || result.state === "prompt") {
              /* write to the clipboard now */
              console.log("read ok");
            }
          });

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
                    //peer.on('close', onClose);

                }

            } catch (e) {
                console.log(e);
            } finally {
                if (failed) {
                    alert("please click Connect in the browser app first");
                }
            }

        }).catch(function(e){
            console.log(e);
        });

    }



    function copyAnswerClickEvent(ev) {
        ev.preventDefault();
        ev.stopPropagation();

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
            
        }
    }

    function forceClose () {
        setupButton(labels.connected, null);
        PIApi.sendToPlugin(
             {
               close: true
            }
        );  
        
    }


    
    function onData(data) {
        if (peer) {
            console.log("onData:",data);
            try {
                PIApi.sendToPlugin({  
                        offer: JSON.parse(data)
                   
                });
            }
            catch(e) {
                console.log(    "error parsing json?:",e , String(data)   );
            }
        } else {
            console.log("onData: no peer",data);
        }
    }

    function onSendToPi(payload) {
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

    function setupButton(label, clickEvent) {
        button.onclick = null;
        button.value = label;
        button.innerHTML = label;
        button.onclick = clickEvent;
        button.disabled = !!!clickEvent;
    }

}