function offerPeer(button) {

    let peer_on,peer = boot(),

        backup,
        wrapped_connect,
        wrapped_close ;


    return peer;

    function boot() {

            let peer = new SimplePeer ({
                initiator: true,
                trickle: false,
                objectMode: false,
            }); 

            peer.on('signal',function(signalData){
                peer.signalJSON = btoa(JSON.stringify(signalData));
                button.value = "connect";
                button.innerHTML = button.value;
                button.addEventListener('click',clickEvent1);          
            });

        peer.on('connect',onConnectEvent);
        peer.on('close',onCloseEvent);
        peer_on = peer.on.bind(peer),

        delete peer.on;
        peer.on = onEvent;

        return peer;
    }


    function onConnectEvent() {
        button.value = "disconnect";
        button.innerHTML = button.value;
        button.addEventListener('click',clickEvent3);  
        button.disabled=false;


        if (typeof wrapped_connect==='function') {
            wrapped_connect();
        }
    }

    function onCloseEvent(){

        button.value = "connect";
        button.innerHTML = button.value;
        button.removeEventListener('click',clickEvent1);  
        button.removeEventListener('click',clickEvent2);  
        button.removeEventListener('click',clickEvent3);  

        peer.destroy();

        peer = boot();


        if (typeof wrapped_close==='function') {
            wrapped_close();
        }

    }

    function onEvent(e,fn) {
            if (e==='connect') {
                wrapped_connect = fn;
            } else {
                if (e==='close') {
                wrapped_close = fn;
                } else {
                return peer_on(e,fn);
                }
            }
    }

    function clickEvent1(ev){

    if (peer.signalJSON) {
        navigator.clipboard.read().then(function(data){
            backup=data;
            navigator.clipboard.writeText(peer.signalJSON).then(function(){
                button.removeEventListener('click',clickEvent1);
                button.value = "click \"paste connection request\" in other app";
                button.innerHTML = button.value;
                button.disabled=true;
                setTimeout(function(){
                    window.addEventListener('blur',onblur)
                },500);
            }).catch(function(err){
                alert(err);
            });
        });
    }

    }

    function onblur () {

        button.value = "paste response";
        button.innerHTML = button.value;

        button.removeEventListener('click',clickEvent1);
        button.addEventListener('click',clickEvent2);
        button.disabled=false;
        window.removeEventListener('blur',onblur) ;

    }

    function clickEvent2(ev) {

    navigator.clipboard.readText().then(function(signalJSON){
        if (peer.signalJSON===signalJSON) {
            return alert('please paste into the other app before clicking here');
        }

        try {
        const signalData = JSON.parse(atob(signalJSON));

        if (signalData.type==='answer') {
            peer.signal(signalData);
            button.removeEventListener('click',clickEvent2);
            navigator.clipboard.write(backup).then(function(){
                button.disabled=true;
            }).catch(function(){

            });
        }

        } catch (e) {
        alert (e);
        }

    }).catch(function(err){
        alert(err);
    });

    }

    function clickEvent3 () {
    peer.destroy();
    }

}  
