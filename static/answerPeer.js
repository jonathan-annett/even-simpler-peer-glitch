function answerPeer(button) {

    let peer_on, peer = boot(),

    backup,
    wrapped_connect,
    wrapped_close;


    return peer;

    function boot() {


        let peer = new SimplePeer({
            initiator: false,
            trickle: false,
            objectMode: false
        });

        button.addEventListener('click', clickEvent1);
        button.value = "paste connection request";
        button.innerHTML = button.value;

        peer.on('connect', onConnectEvent);
        peer.on('close', onCloseEvent);
        peer_on = peer.on.bind(peer),

        delete peer.on;
        peer.on = onEvent;

        return peer;
    }



    delete peer.on;
    peer.on = onEvent;

    return peer;

    function onConnectEvent() {
        button.value = "disconnect";
        button.innerHTML = button.value;
        button.addEventListener('click', clickEvent3);
        button.disabled = false;


        if (typeof wrapped_connect === 'function') {
            wrapped_connect();
        }
    }

    function onCloseEvent() {

        button.value = "connect";
        button.innerHTML = button.value;
        button.removeEventListener('click', clickEvent1);
        button.removeEventListener('click', clickEvent2);
        button.removeEventListener('click', clickEvent3);

        peer.destroy();

        peer = boot();


        if (typeof wrapped_close === 'function') {
            wrapped_close();
        }

    }

    function onEvent(e, fn) {
        if (e === 'connect') {
            wrapped_connect = fn;
        } else {
            if (e === 'close') {
                wrapped_close = fn;
            } else {
                return peer_on(e, fn);
            }
        }
    }


    function clickEvent1(ev) {
        button.disabled = true;
        navigator.clipboard.readText().then(function(signalJSON) {
            try {
                const signalData = JSON.parse(atob(signalJSON));

                button.value = "...busy...";
                button.innerHTML = button.value;
                button.removeEventListener('click', clickEvent1);

                peer.on('signal', function(signalData) {
                    peer.signalJSON = btoa(JSON.stringify(signalData));
                    button.value = "copy connection response";
                    button.innerHTML = button.value;
                    button.addEventListener('click', clickEvent2);
                    button.disabled = false;

                    clickEvent2(ev);

                });

                if (signalData.type === 'offer') {
                    peer.signal(signalData);
                } else {
                    button.disabled = false;
                }

            } catch (e) {
                button.disabled = false;
                alert(e);
            }
        });
    }

    function clickEvent2(ev) {

        if (peer.signalJSON) {
            navigator.clipboard.writeText(peer.signalJSON).then(function() {
                button.disabled = true;
                button.removeEventListener('click', clickEvent2);
                button.value = "click \"paste response\" into other app";
                button.innerHTML = button.value;

            }).
            catch (function() {});
        }

    }


    function clickEvent3() {
        peer.destroy();
    }

}