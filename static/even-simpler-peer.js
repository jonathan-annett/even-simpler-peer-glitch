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


function evenSimplerPeer(headless) {
  
  let options = typeof headless === 'object'? headless : { headless : !!headless };
  const html = document.querySelector('html');
    
  if (typeof headless==='undefined') {
    options = {
      target_origin : location.origin,
      target_href   : location.href.replace(/\?.*/,''),
      manual: html.classList.contains('peer-manual'),
      scan: html.classList.contains('peer-scan'),
      qr : html.classList.contains('peer-qr'),
      link : html.classList.contains('peer-link'),
      custom: html.classList.contains('peer-custom') ? 'copy' : false,
      headless : false
    }
  }
  
  const domain        = "even-simpler-peer.glitch.me";
  const iframe_url    = options.headless ? `https://${domain}/even-simpler-api-headless.html` : `https://${domain}/api`;
  const target_origin = `https://${domain}/`;
  
  const events = {
     connected    : [],
     message      : [],
     disconnected : []
  };

   
  const self =  {
    
    send :      sendToPeer,
    
    setPeerId : setPeerId,
    
    setTargetHref : setTargetHref, 
    
    on   : function (e,fn) {
       if (typeof e + typeof fn ==='stringfunction' && events[e]) {
          const ix = events[e].indexOf(fn);
          if (ix<0) events[e].push(fn);
       }
    },
    
    off   : function (e,fn) {
       if (typeof e + typeof fn ==='stringfunction' && events[e]) {
          const ix = events[e].indexOf(fn);
          if (ix>=0) events[e].splice(ix,1);
       }
    }
    
  };

  
  const iframe = document.createElement('iframe');
  
  iframe.src = iframe_url;
  
  iframe.setAttribute('allow','clipboard-read; clipboard-write');
  
  iframe.onload = function () {
    
      const 
      payload = { options:options };

      let param_id = location.search.replace(/^\?/,'').replace(/\&.*/,'');

      window.peerInfo = window.peerInfo || function(x){
        peerInfo.db = x;
      };

      window.peerPostMessage = function(data){
      
        const event = new MessageEvent("message", {
          data: data,
        });

        if (data.connected && data.connected.peer_id && data.connected.own_id) {
          self.peer_id = data.connected.peer_id;
          self.own_id  = data.connected.own_id;
        }

        window.dispatchEvent(event);
      };
      
      if (param_id && param_id.length===24) {
        
        payload.own_id=param_id.substr(0,12);
        payload.peer_id=param_id.substr(12);
        self.peer_id = payload.peer_id;
        self.own_id  = payload.own_id;

        //setTimeout(location.replace.bind(location),250,payload.options.target_href);
    
      } 
      iframe.contentWindow.postMessage(payload,target_origin);  
     
  };
  
  document.body.appendChild(iframe);
       
  window.addEventListener('message',function(event){

      if (event.data.message) {
          events.message.forEach(function(fn){
            fn(event.data.message);
          });
      } else {
          if (event.data.connected) {
            //iframe.style.display="none";
            events.connected.forEach(function(fn){
              fn(event.data.connected);
            });
          } else {
            if (event.data.disconnected) {
              //iframe.style.display="block";              
              events.disconnected.forEach(function(fn){
                fn(event.data.disconnected);
              });
            }
          }
      }
     
  });
  
  function sendToPeer(msg) {
      iframe.contentWindow.postMessage({send:msg},target_origin);     
  }
  
  function setPeerId(id) {
      iframe.contentWindow.postMessage({setPeerId:id},target_origin);      
  }
    
  function setTargetHref (href) {
      iframe.contentWindow.postMessage({target_href:href},target_origin);      
  }
  

  return self;
  
}
