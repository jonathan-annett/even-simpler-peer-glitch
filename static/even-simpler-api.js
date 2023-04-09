/* global SimplePeer,QRCode */

/*
MIT License

Copyright (c) 2023 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

const o2j = JSON.stringify.bind(JSON), j2o = JSON.parse.bind(JSON);

const baseurl = location.origin.replace(/\/$/, "") + "/api";
let own_id = inventId(), own_id_clean = cleanupId(own_id);
const enter_peer_id = document.querySelector("#enter_peer_id");
const show_own_id = document.querySelector("#show_own_id");
const connections = document.querySelector("#connections");
const connect_info = document.querySelector("#connect_info");
const logview = document.querySelector("#log");
const reset_btn = document.querySelector('#reset_btn');
const copy_btn = document.querySelector('#copy_btn');
const qr_btn = document.querySelector('#qr_btn');
const custom_btn = document.querySelector('#custom_btn');
const scan_btn = document.querySelector('#scan_btn');

const qrCode = document.querySelector("#qrcode");

let target_origin = location.origin;
let target_href = location.href.replace(/\?.*/, '');
let share_url;
const framed = (window.location !== window.parent.location);

function log() {
  //if (framed) return;
  logview.innerHTML += [].map.call(arguments, function (a) {
    return a ? a.toString() : "";
  }).join(" ") + "<br>";
}


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

  function answerPeer(button) {

    let peer_on,peer = boot(),

        backup,
        wrapped_connect,
        wrapped_close ;


    return peer;

    function boot() {


      let peer = new SimplePeer ({              
          initiator: false,
          trickle: false,
          objectMode: false
      }); 

      button.addEventListener('click',clickEvent1);
      button.value     = "paste connection request";
      button.innerHTML = button.value;

      peer.on('connect',onConnectEvent);
      peer.on('close',onCloseEvent);
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



      function clickEvent1(ev) {
         button.disabled=true;
         navigator.clipboard.readText().then(function(signalJSON){
             try {
                const signalData = JSON.parse(atob(signalJSON));

                button.value     = "...busy...";
                button.innerHTML = button.value;
                button.removeEventListener('click',clickEvent1);

                peer.on('signal',function(signalData){
                   peer.signalJSON  = btoa(JSON.stringify(signalData));
                   button.value     = "copy connection response";
                   button.innerHTML = button.value;
                   button.addEventListener('click',clickEvent2);
                   button.disabled=false;

                   clickEvent2(ev);

                });

                if (signalData.type==='offer') {
                   peer.signal(signalData);
                } else {
                   button.disabled=false;
                }

            } catch (e) {
               button.disabled=false;
               alert (e);
            }
         });  
      }

      function clickEvent2(ev){

        if (peer.signalJSON) {
            navigator.clipboard.writeText(peer.signalJSON).then(function(){
                button.disabled=true;
                button.removeEventListener('click',clickEvent2);
                button.value     = "click \"paste response\" into other app";
                button.innerHTML = button.value;

            }).catch(function(){
            });
        }

      }


    function clickEvent3 () {
       peer.destroy();
    }

  }


 

let peerConfig = {
  initiator: true,
  trickle: false,
  objectMode: false,
};

let peer = new SimplePeer(peerConfig);


reset_btn.onclick = function () {
  sessionStorage.clear();
  location.reload();
};

copy_btn.onclick = function () {
  sessionStorage.clear();
  let new_peer_id = cleanupId(inventId());
  sessionStorage.clear();
  own_id = inventId();
  own_id_clean = cleanupId(own_id);
  show_own_id.innerHTML = formatId(own_id);

  savePeerId(new_peer_id);
  let share_url = target_href + '?' + new_peer_id + own_id_clean;
  navigator.clipboard.writeText(share_url);
  enter_peer_id.value = formatId(new_peer_id);
  setTimeout(peer_id_changed, 500);
  logview.innerHTML = "";
  log('the link is: ' + share_url + '\n\n' +
    'it has been copied to the clipboard.\n\n' +
    'send it to the other device (via email/sms/dm )\n\n' +
    'and open it there to link the devices'
  );
}

qr_btn.onclick = function (e) {
  sessionStorage.clear();
  let new_peer_id = cleanupId(inventId());
  sessionStorage.clear();
  own_id = inventId();
  own_id_clean = cleanupId(own_id);
  show_own_id.innerHTML = formatId(own_id);
  savePeerId(new_peer_id);
  share_url = target_href + '?' + new_peer_id + own_id_clean;
  //navigator.clipboard.writeText(share_url);
  enter_peer_id.value = new_peer_id;
  setTimeout(peer_id_changed, 500);
  logview.innerHTML = "";
  qrCode.style.display = "block";
  qrCode.innerHTML = "<h1>Scan with cameraphone to link it to this screen <button> X </button> </h1>";
  let qr = new QRCode(qrCode, share_url);
  const btns = qrCode.querySelector("button");
  btns.onclick = CloseClick;
}

function CloseClick() {
  qrCode.style.display = "none";
  qrCode.innerHTML = "";
}

scan_btn.onclick = function () {
  window.parent.location.href = "https://scan.1mb.site";
}

custom_btn.onclick = function () {
  sessionStorage.clear();
  own_id = '';
  own_id_clean = cleanupId(own_id);
  show_own_id.innerHTML = formatId(own_id);

  connect_info.style.display = "none";

  let test_peer = offerPeer(custom_btn);
  test_peer.on('connect',function(){
     log('connected ok');
  });

  /*

  // make a random id to paste into custom app
  let customId = (randomId() + randomId()).replace(/\-/g, '');

  savePeerId('');
  let cliptext = custom_btn.value.replace(/\s/g, '') + ':' + customId;
  navigator.clipboard.writeText(cliptext);

  enter_peer_id.value = '';
  logview.innerHTML = "";
  log('the custom id is : ' + customId + '\n\n' +
    'it has been copied to the clipboard.\n\n'
  );

  customConnect(customId); */
}


if (framed) {

  window.addEventListener('message', onFrameMessage);

}

show_own_id.innerHTML = formatId(own_id);
peer.on("signal", function (data) {
  peer._signal_data = data;
});

peer.on("error", function (err) {
  log("error", err);
  setTimeout(location.reload.bind(location), 1000);
});

let prior_peer = sessionStorage.getItem("peer-id");
if (prior_peer) {
  enter_peer_id.value = prior_peer;
  setTimeout(peer_id_changed, 500);
} else {
  enter_peer_id.onkeyup = peer_id_changed;
  //enter_peer_id.oninput  = peer_id_changed;
  enter_peer_id.onchange = peer_id_changed;
}


function onFrameMessage(event) {

  if (event.data.target_origin) {
    // is used to address replies to the owner window.
    // since that's not information we can glean internally
    // it's up to the page that loaded the iframe to send it through as 
    // one of the first messages (ie before we ever need to reply)
    target_origin = event.data.target_origin;
  }

  if (event.data.target_href) {
    // target_href is the full url of the page that has loaded us
    // this is so we can generate urls for peer devices and embed them 
    // into qr codes so we can deep link into exactly where to send the 
    // peer device to start the link process. note that this can be overridden
    // by the loading page (see otions below)
    target_href = event.data.target_href;
  }
  const opt = event.data.options;
  if (opt) {

    if (opt.target_href) {
      target_href = opt.target_href;
    }
    
    // truthy options will display the associated buttons
    reset_btn.style.display = !!opt.manual ? "inline-block" : "none";
    copy_btn.style.display = !!opt.link ? "inline-block" : "none";
    qr_btn.style.display = !!opt.qr ? "inline-block" : "none";
    custom_btn.style.display = !!opt.custom ? "inline-block" : "none";
    scan_btn.style.display = !!opt.scan ? "inline-block" : "none";

    // opt.custom can be true (meaning use the default label of "Custom")
    // or a string which supplies the label
    if (typeof opt.custom === 'string') {
      custom_btn.value = opt.custom;
      custom_btn.innerHTML = opt.custom;

    }

  }

  if (event.data.send) {
    sendToPeer({ message: event.data.send });
    return log(o2j(event.data.send));
    // note: if a message includes the send command, we exit after sending
    // it's not possible to also set the peer_id or own_id in the same 
    // message, and it's unlikely you'd ever want to.
    // it's perfectly valid however to set the target_origin, target_href
    // and send the first message inside a single postMessage 
  }

  let reload_needed = false;

  if (validateId(event.data.peer_id)) {

    if (enter_peer_id.value !== event.data.peer_id) {
      enter_peer_id.value = event.data.peer_id
      reload_needed = true;
    }

  }

  if (validateId(event.data.own_id)) {
    if (own_id_clean !== event.data.own_id) {
      own_id_clean = event.data.own_id;
      reload_needed = true;
    }
  }


  if (reload_needed) {
    sessionStorage.setItem('numeric-id', formatId(own_id_clean));
    savePeerId(enter_peer_id.value);
    location.reload();
  }




}

function formatId(id) {
  id = cleanupId(id);
  if (id.length > 3) {
    let i1 = id.substring(0, 3);
    let i2 = id.substring(3);
    if (i2.length > 4) {
      let i3 = i2.substring(4);
      i2 = i2.substring(0, 4);
      id = i1 + "-" + i2 + "-" + i3;
    } else {
      id = i1 + "-" + i2;
      if (id.length === 3 + 1 + 4) {
        id += "-";
      }
    }
  } else {
    if (id.length === 3) {
      id += "-";
    }
  }
  return id;
}

function peer_id_changed(ev) {
  if (ev && ev.key === "Backspace") return;

  let peer_id = cleanupId(enter_peer_id.value);
  let id = formatId(enter_peer_id.value);

  enter_peer_id.value = id;

  if (validateId(peer_id)) {
    if (peer_id === own_id_clean) {
      log("can't connect to the same browser!");
      enter_peer_id.style.backgroundColor = "red";
    } else {
      enter_peer_id.onkeyup = null;
      enter_peer_id.oninput = null;
      enter_peer_id.onchange = null;

      savePeerId(peer_id);

      if (Number(peer_id) < Number(own_id_clean)) {
        log("listening for peer connect");
        listenForPeer();
      } else {
        log("connecting to peer");
        connectToPeer();
      }
      enter_peer_id.style.backgroundColor = "lime";
    }
  } else {
    enter_peer_id.style.backgroundColor =
      peer_id.length === 3 + 4 + 5 ? "red" : "white";
  }
}

function sendToPeer(data) {
  peer.send(o2j(data));
}
function savePeerId(peer_id) {
  sessionStorage.setItem("peer-id", peer_id);
}

function listenForPeer() {
  let peer_id = cleanupId(enter_peer_id.value);
  let retries = 0;

  enter_peer_id.style.disabled = true;

  waitForPeer(peer_id, function (err) {

    let signal_id_in = peer_id + own_id_clean;
    let signal_id = own_id_clean + peer_id;

    delete peer._signal_data;

    let errored = false;
    peer = null;
    peerConfig.initiator = false;
    peer = new SimplePeer(peerConfig);

    log("calling getPeerSignal()", signal_id_in);

    getPeerSignal();

    peer.on("error", function (err) {
      log("error", err);
    });

    peer.on("signal", function (data) {

      goPostal(
        baseurl,
        { set: { id: signal_id, data: data } },
        function (err, res) {
          if (err) {
            log(err);
          } else {
            log("sent reply signal");
          }
        }
      );
    });

    peer.on("connect", onPeerConnect.bind(this, signal_id, peer_id));

    function getPeerSignal() {

      goPostal(baseurl, { get: signal_id_in }, function (err, signalData) {
        if (!err && signalData) {
          log("got peer signal...");
          return peer.signal(signalData);
        }
        if (err) console.log(err);
        if (retries++ < 200) {
          log("getPeerSignal() attempt #", retries, signal_id_in);
          return setTimeout(getPeerSignal, 1);
        }
      });

    }

  });
}

function connectToPeer() {
  let peer_id = cleanupId(enter_peer_id.value);
  let signal_id = own_id_clean + peer_id;
  let signal_id_in = peer_id + own_id_clean;

  let retries = 0;

  enter_peer_id.style.disabled = true;

  peer.on("connect", onPeerConnect.bind(this, signal_id, peer_id));

  waitForPeer(peer_id, function (err) {
    if (err) return log(err);
    sendSignalData(signal_id, function (err, setOk) {
      if (err) {
        log(err);
      }
      if (setOk) {
        log("calling getPeerSignal()", signal_id_in);
        getPeerSignal();
      }
    });
  });

  function sendSignalData(signal_id, cb) {
    const data = peer._signal_data;
    if (data) {
      goPostal(baseurl, { set: { id: signal_id, data: data } }, cb);
    } else {
      console.log("waiting for signal data...");
      setTimeout(sendSignalData, 2000, signal_id, cb);
    }
  }

  function getPeerSignal() {

    goPostal(baseurl, { get: signal_id_in }, function (err, signalData) {
      if (!err && signalData) {
        log("got peer signal...");
        return peer.signal(signalData);
      }
      if (err) console.log(err);
      if (retries++ < 200) {
        log("getPeerSignal() attempt #", retries, signal_id_in);
        return setTimeout(getPeerSignal, 1000);
      }
    });
  }
}

const customConnectTimeouts = {};


function customConnect(customId) {

  // kill any connecting instances
  Object.keys( customConnectTimeouts).forEach(function(instance){
    clearTimeout(customConnectTimeouts [instance]);
    delete customConnectTimeouts [ instance ];
  });

  let retries = 0;

  let instance = Date.now(36).toString+Math.random().toString(36);
  
  enter_peer_id.style.disabled = true;

  const signal_id_in  = customId + '-signal-initiator';
  const signal_id_out = customId + '-signal-answer';

  delete peer._signal_data;

  let errored = false;
  peer = null;
  peerConfig.initiator = false;
  peer = new SimplePeer(peerConfig);

  log("calling getPeerSignal()", signal_id_in);

  customConnectTimeouts [instance] = setTimeout(getPeerSignal,1);

  peer.on("error", function (err) {
    log("error", err);
  });

  peer.on("signal", function (data) {

    goPostal(
      baseurl,
      {
        set: {
          id: signal_id_out,
          data: data
        }
      },
      function (err, res) {
        if (err) {
          log(err);
        } else {
          log("sent reply signal",signal_id_out,"===>",o2j( data ) );
        }
      }
    );
  });

  peer.on("connect", function () {

    peer.on("data", function (json_data) {
      const data = j2o(String(json_data));

      if (framed) {
        if (data.message) {
          window.parent.postMessage({ message: data.message }, target_origin);
        }
      } else {
        log("got data", json_data);
      }


      if (data && data.ping) {
        pings++;
        ping_count.innerHTML = pings.toString() + " pings received";
        return sendToPeer({ pingReply: data.ping });
      }

      if (data && data.pingReply) {
        ping_time.innerHTML =
          (Date.now() - data.pingReply.now).toString() + " round trip msec";
        return;
      }


    });

    peer.on("close", function () {

      if (framed) {
        window.parent.postMessage({ disconnected: { connect_id, peer_id } }, target_origin);
      } else {
        log("closed");
      }
      location.reload();
    });

  });

  function getPeerSignal() {
    
    if (! customConnectTimeouts [instance]) {
      //we are done.
      if (peer) peer.destroy();
      return;
    }

    delete customConnectTimeouts [instance];

    goPostal(baseurl, { get: signal_id_in }, function (err, signalData) {
      if (!err && signalData) {
        log("got peer signal...");
        return peer.signal(signalData);
      }
      if (err) console.log(err);
      if (retries++ < 200) {
        log("getPeerSignal() attempt #", retries, signal_id_in);
        customConnectTimeouts [instance] = setTimeout(getPeerSignal,1);
      }
    });

  }



}

function onPeerConnect(connect_id, peer_id) {

  if (framed) {
    window.parent.postMessage({ connected: { connect_id, peer_id } }, target_origin);
  } else {
    log("connected connect_id=", connect_id, "peer=", peer_id);
  }
  savePeerId(peer_id);

  let conn_div = document.createElement("div");

  let ping_btn = document.createElement("button");
  ping_btn.innerHTML = "ping";
  conn_div.appendChild(ping_btn);

  let ping_time = document.createElement("div");
  conn_div.appendChild(ping_time);

  let ping_count = document.createElement("div");
  let pings = 0;
  conn_div.appendChild(ping_count);

  connections.appendChild(conn_div);

  peer.on("data", function (json_data) {
    const data = j2o(String(json_data));

    if (framed) {
      if (data.message) {
        window.parent.postMessage({ message: data.message }, target_origin);
      }
    } else {
      log("got data", json_data);
    }


    if (data && data.ping) {
      pings++;
      ping_count.innerHTML = pings.toString() + " pings received";
      return sendToPeer({ pingReply: data.ping });
    }

    if (data && data.pingReply) {
      ping_time.innerHTML =
        (Date.now() - data.pingReply.now).toString() + " round trip msec";
      return;
    }

    if (data && data.new_peer_id) {
      savePeerId(data.new_peer_id);
      location.reload();
    }


  });

  peer.on("close", function () {

    if (framed) {
      window.parent.postMessage({ disconnected: { connect_id, peer_id } }, target_origin);
    } else {
      log("closed");
    }
    location.reload();
  });

  peer.on("error", function (err) {
    log("error", err);
    setTimeout(location.reload.bind(location), 1000);
  });

  ping_btn.onclick = function () {
    log("sending ping");
    return sendToPeer({ ping: { now: Date.now() } });
  };

  if (framed) {
    // connect_info.style.display="none";
  }


}

function waitForPeer(peer_id, cb) {
  let token = Date.now().toString() + Math.random().toString();
  waitForPeer.token = token;

  peer_id = cleanupId(peer_id);
  const setPayload = { set: { id: own_id_clean, data: { peer: peer_id } } };
  const getPayload = { get: peer_id };

  if (validateId(peer_id) && validateId(own_id_clean)) {
    if (own_id_clean !== peer_id) {
      goPostal(baseurl, setPayload, setCB);
    }
  }

  function setCB(err, res) {
    if (err) return cb(err);
    if (waitForPeer.token === token) {
      goPostal(baseurl, getPayload, getCB);
    }
  }

  function getCB(err, check) {
    if (waitForPeer.token === token) {

      if (!err && check && check.peer === own_id_clean) {
        log("peer", peer_id, "is ready");
        // 
        return (waitForPeer.token === token) ? cb() : undefined;
      }

      if (!err && check && check.new_peer) {
        log("switching to peer:", peer_id, "-->", check.new_peer);
        peer_id = cleanupId(check.new_peer);
        setPayload.data.peer = peer_id;
        getPayload.get = peer_id;

      }

      log("waiting for peer...", peer_id);
      setTimeout(goPostal, 100, baseurl, setPayload, setCB);
    }
  }

}

function randomId() {
  const R = function (n) {
    n = n || 3;
    let r = Math.floor(Math.random() * 1000000);
    return ("0000" + r.toString()).slice(0 - n);
  };

  return `${R(3)}-${R(4)}-${R(4)}`;


}

function inventId() {
  let prior = sessionStorage.getItem("numeric-id");
  if (prior && validateId(prior)) {
    return prior;
  }

  let id = randomId();

  let result = id + checkDigit(id);

  sessionStorage.setItem("numeric-id", result);

  return result;
}

function cleanupId(id) {
  return id
    .split("")
    .filter(function (n) {
      return n >= "0" && n <= "9";
    })
    .join("");
}

function checkDigit(id) {
  let digits = cleanupId(id)
    .split("")
    .map(function (n) {
      return Number(n);
    });

  let check =
    digits.reduce(function (a, n) {
      return a + n;
    }, 0) % 10;

  return check.toString();
}

function validateId(id) {
  if (typeof id === "string" && id.length >= 3 + 4 + 5) {
    id = id.trim();
    let check = checkDigit(id.substring(0, id.length - 1));
    return id.endsWith(check);
  }
  return false;
}

function goPostal(url, data, cb) {
  var http = new XMLHttpRequest();
  var json = o2j(data);
  http.open("POST", url, true);

  //Send the proper header information along with the request
  http.setRequestHeader("Content-type", "application/json");

  http.onreadystatechange = function () {
    //Call a function when the state changes.
    if (http.readyState == 4 && http.status == 200) {
      try {
        cb(null, j2o(http.responseText));
      } catch (e) {
        cb(e);
      }
    }
  };
  http.send(json);
}
