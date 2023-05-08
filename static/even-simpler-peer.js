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

/* global SimplePeer */

/*
 
  this is based loosely on the concept used by the youtube player api:
  the client page calls a single function which places a mostly non visual iframe on the page
  (mostly, because there is a ui to connect, once connected, the ui can be hidden)

  peer = evenSimplerPeer() 
     create peer with default options, pulling visibilty state from current css 
     the link url will the current page, and it won't headless

      eg <html class="peer-qr peer-link"> would provide 2 buttons qr and copy link

  peer = evenSimplerPeer(true) 
    create a headless peer (does not attempt to display any ui, and this will only work if you've)
    previously established a connection in the same session.

  peer = evenSimplerPeer(false)
    create a ui peer without any buttons, but showing the current connection state and logs etc
    this also will only work if you've previously established a connection in the same session
    (for example if you follow a link that reloads a different page and want to reestablish the link)
    the peer uses sessionStorage to resetablish the webrtc connection based on the addreses set up earlier 
  
  peer = evenSimplerPeer({ ...options as below... }) 
  
     this is where you get to specify everything, including custom link urls and optionally 
     provide your own ui which manages the storage of the link addresses

      target_origin - this should be the origin of the current page
                      it's used to establish correct CORS within the iframe embedding code
      target_href   - this is the url that's used in qr codes or clipboard copied links

      (all of the following are bools)
      manual        - provide a button that lets user type in their own address info
      scan          - provide a button that loads a browser based qr-scanner which can be used
                    - to seamlessly link to another device
      qr            - provide a button to display a qr code which can be used by other devices
                      to link to this device (uses target_href to form the url)
                      note: this button will also regenerate new random ids for the adddresses
      link          - provide a button that when clicked, generates random ids, and copies a url to the clipboard
                      this can be pasted into another browser or app, or emailed/sms to send it to the 
                      another user. also uses target_href to generate the url, so it could be anything
                      including a link to a mobile app 
      custom        - display a custom button which copies a base64 encoded payload to paste into 
                      an app. this contains all the sdp information needed to establish a connection


      headless      - don't display any ui (ignores all previous button settings)

      own_id        
      peer_id       - provide these when in headless mode to use those addreses instead of whatever is in session storage
                      these will be saved in session storage and the link will be established

 examples

   peer =  evenSimplerPeer();
   peer = evenSimplerPeer({
      target_origin:location.origin,
      target_href:location.origin+'/mycustom-link',
      own_id  : '12345678',
      peer_id : '87654321'
      headless: true
   });

*/

const even_simpler_domain = "even-simpler-peer.glitch.me";


function evenSimplerPeer(headless) {
  let options =
    typeof headless === "object" ? headless : { headless: !!headless };
  const html = document.querySelector("html");

  if (typeof headless === "undefined") {
    options = {
      target_origin: location.origin,
      target_href: location.href.replace(/\?.*/, ""),
      manual: html.classList.contains("peer-manual"),
      scan: html.classList.contains("peer-scan"),
      qr: html.classList.contains("peer-qr"),
      link: html.classList.contains("peer-link"),
      custom: html.classList.contains("peer-custom") ? "copy" : false,
      headless: false,
    };
  }

  const iframe_url = options.headless
    ? `https://${even_simpler_domain}/even-simpler-api-headless.html`
    : `https://${even_simpler_domain}/api`;
  const target_origin = `https://${even_simpler_domain}/`;

  let events = {
    connect: [],
    message: [],
    close: [],
    error: [],
  };

  let iframe = document.createElement("iframe");

  const self = {
    send: sendToPeer,

    setPeerId: setPeerId,

    setTargetHref: setTargetHref,

    on: function (e, fn) {
      if (typeof e + typeof fn === "stringfunction" && events[e]) {
        const ix = events[e].indexOf(fn);
        if (ix < 0) events[e].push(fn);
      } else {
        if (typeof e === "string" && !events[e]) {
          console.log(e, "is not a recognized event name");
        }
      }
    },

    off: function (e, fn) {
      if (typeof e + typeof fn === "stringfunction" && events[e]) {
        const ix = events[e].indexOf(fn);
        if (ix >= 0) events[e].splice(ix, 1);
      } else {
        if (typeof e === "string" && !events[e]) {
          console.log(e, "is not a recognized event name");
        }
      }
    },
    destroy: function () {
      window.removeEventListener("message", onMessages);

      events.connect.splice(0, events.connect.lemgth);
      events.close.splice(0, events.close.lemgth);
      events.message.splice(0, events.message.lemgth);
      events.error.splice(0, events.error.lemgth);
      delete events.message;
      delete events.close;
      delete events.connect;
      delete events.error;
      events = null;

      if (iframe) {
        iframe.parentElement.removeChild(iframe);
        iframe = null;
      }
    },
  };

  iframe.src = iframe_url;

  iframe.setAttribute("allow", "clipboard-read; clipboard-write");

  iframe.onload = function () {
    const payload = { options: options };

    let param_id = location.search.replace(/^\?/, "").replace(/\&.*/, "");

    window.peerInfo =
      window.peerInfo ||
      function (x) {
        window.peerInfo.db = x;
      };

    window.peerPostMessage = function (data) {
      const event = new MessageEvent("message", {
        data: data,
      });

      if (data.connected && data.connected.peer_id && data.connected.own_id) {
        self.peer_id = data.connected.peer_id;
        self.own_id = data.connected.own_id;
      }

      window.dispatchEvent(event);
    };

    if (param_id && param_id.length === 24) {
      payload.own_id = param_id.substr(0, 12);
      payload.peer_id = param_id.substr(12);
      self.peer_id = payload.peer_id;
      self.own_id = payload.own_id;

      //setTimeout(location.replace.bind(location),250,payload.options.target_href);
    }
    iframe.contentWindow.postMessage(payload, target_origin);
  };

  document.body.appendChild(iframe);

  window.addEventListener("message", onMessages);

  function onMessages(event) {
    if (event.data.message) {
      events.message.forEach(function (fn) {
        fn(event.data.message);
      });
    } else {
      if (event.data.connected) {
        //iframe.style.display="none";
        events.connect.forEach(function (fn) {
          fn(event.data.connected);
        });
      } else {
        if (event.data.disconnected) {
          //iframe.style.display="block";
          events.close.forEach(function (fn) {
            fn(event.data.disconnected);
          });
        } else {
          if (event.data.error) {
            //iframe.style.display="block";
            events.error.forEach(function (fn) {
              fn(event.data.error);
            });
          }
        }
      }
    }
  }

  function sendToPeer(msg) {
    iframe.contentWindow.postMessage({ send: msg }, target_origin);
  }

  function setPeerId(id) {
    iframe.contentWindow.postMessage({ setPeerId: id }, target_origin);
  }

  function setTargetHref(href) {
    iframe.contentWindow.postMessage({ target_href: href }, target_origin);
  }

  return self;
}

function evenSimplerWSPeer({ own_id, peer_id }) {
  
  const protocol = location.protocol.replace(/^http/, "ws");
  const wss_url = `${protocol}//${even_simpler_domain}/`;
  const connection_firstmessage = JSON.stringify({own_id, peer_id});
  
  let connection = new WebSocket( wss_url );
  let first_payload = true;
    

  let fifo = [],
    events = {
      data: [pendingData],
      rest: []
    };

  let peer;

  let peerok = false,
      connok = false;

  connection.onopen = connection_onopen;
  connection.onerror = connection_oncloseerorr;
    
  return {
    on:       onPeerEvent,
    send:     sendPeerData,
    destroy : destroyPeer
  };

  
  
  function  connection_onopen () {
    connection.onopen=null;
    connection.onclose = connection_oncloseerorr;
    connection.onmessage = connection_onmessage;

    connok = true;
    connection.send(connection_firstmessage);
  }

  
  function connection_oncloseerorr() {
    connok = false;
    connection.onclose=null;
    connection.onerror=null;
    connection.onmessage=null;
   
    connection = new WebSocket( wss_url );
    connection.onopen = connection_onopen;
    connection.onerror = connection_oncloseerorr;
  }



  function connection_onmessage(message) {
    const msg = JSON.parse(message.data);
    console.log({connection_onmessage:msg})

    if (msg.data) {
      // this is a message from the remote peer
      // intended to be delivered locally
      // (it was transported over the websocket connection)
      events.data.forEach(function (fn) {
        fn(msg.data,"ws");
      });
    }

    if (msg.webrtc) {
      
      // this is a webrtc channel setup request
      // we use SimplePeer for this
      const { initiator, trickle, objectMode, payload } = msg.webrtc;
      // validate the message by checking for 4 specific members
      if (
        typeof initiator +
          typeof trickle +
          typeof objectMode +
          typeof payload ===
        "booleanbooleanbooleanobject"
      ) {
        // remove the payload member as that's not part of the SimplePeer options args
        delete msg.webrtc.payload;
        // instantiate the SimplePeer object
        if (peer) peer.destroy();
        peer = new SimplePeer(msg.webrtc);
        peer.on("signal", function (signal) {
          // when we get a signal immediately relay it over the websocket to the other side
          console.log("relaying signal to peer",signal);
          connection.send(JSON.stringify({ signal: signal }));
        });
        peer.on("connect", function () {
          // once connected, we can start forwarding incoming data
          peer.on("data", function (data) {
            const msg = JSON.parse(data);
            events.data.forEach(function (fn) {
              fn(msg,"webrtc");
            });
          });
          peer.on("close", function () {
            peerok = false;
            if (connok) {
               connok=false;
               connection.close();
            }
          });
          peerok = true;
        });
        if (first_payload) {
          // send the initial payload
          events.data.forEach(function (fn) {
            fn(payload,"init");
          });
          first_payload=false;
        }
        
        peer.on("error", function () {
          peerok = false;
        });
      }
    }

    if (msg.signal) {
      // this is an incoming signal from the remote peer object
      if (peer) {
        peer.signal(msg.signal);
      }
    }
    
    if (msg.rest) {
      console.log('rest:',msg.rest);
      events.rest.forEach(function(fn){
         fn(msg.rest);
      });
    }
  }

  function onPeerEvent(e, fn) {
    if (e === "data") {
      const ix = events.data.indexOf(pendingData);
      if (ix >= 0) events.data.splice(ix, 1);
      fifo.splice(0, fifo.length).forEach(fn);
    }

    if (events[e]) {
      events[e].push(fn);
    } else {
      events[e] = [fn];
    }
  }

  function sendPeerData(data) {
    if (peerok) {
      // we can send the data over the webrtc connection
      return peer.send(JSON.stringify(data));
    }
    if (connok) {
      // we are forced to fallback to sending the message over the websocket
      return connection.send(
        JSON.stringify({
          data: data,
        })
      );
    }
  }

  function pendingData(data) {
    fifo.push(data);
  }
  
  function destroyPeer() {
      peerok=false;
      connok=false
      if (peer) {
        peer.destroy();
        peer=null;
      }     
    
     if (events) {
       events.data.splice(0,events.data.lemgth);
       delete events.data;
       events = null;
     }
    
     if (fifo) {
       fifo.splice(0,fifo.length);
       fifo = null;
     }
  }
  
}

evenSimplerPeer.inventId = function inventId() {
  let id = randomId();

  let result = id + evenSimplerPeer.checkDigit(id);

  return result;

  function randomId() {
    const R = function (n) {
      n = n || 3;
      let r = Math.floor(Math.random() * 1000000);
      return ("0000" + r.toString()).slice(0 - n);
    };

    return `${R(3)}-${R(4)}-${R(4)}`;
  }
};

evenSimplerPeer.cleanupId = function cleanupId(id) {
  return id
    .split("")
    .filter(function (n) {
      return n >= "0" && n <= "9";
    })
    .join("");
};

evenSimplerPeer.checkDigit = function checkDigit(id) {
  let digits = evenSimplerPeer
    .cleanupId(id)
    .split("")
    .map(function (n) {
      return Number(n);
    });

  let check =
    digits.reduce(function (a, n) {
      return a + n;
    }, 0) % 10;

  return check.toString();
};

evenSimplerPeer.validateId = function validateId(id) {
  if (typeof id === "string" && id.length >= 3 + 4 + 5) {
    id = id.trim();
    let check = evenSimplerPeer.checkDigit(id.substring(0, id.length - 1));
    return id.endsWith(check);
  }
  return false;
};
