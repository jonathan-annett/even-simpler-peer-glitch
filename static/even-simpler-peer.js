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

function evenSimplerPeer(headless) {
  
  const domain        = "even-simpler-peer.glitch.me";
  const iframe_url    = headless ? `https://${domain}/even-simpler-api-headless.html` : `https://${domain}/api`;
  const target_origin = `https://${domain}/`;
  
  const events = {
     connected    : [],
     message      : [],
     disconnected : []
  };
  
  const iframe = document.createElement('iframe');
  
  iframe.src = iframe_url;
  
  iframe.setAttribute('allow','clipboard-read; clipboard-write');
  
  iframe.onload = function () {
    
      const 
      html = document.querySelector('html'),
      payload = {options:{
        target_origin : location.origin,
        target_href   : location.href.replace(/\?.*/,''),
        manual: html.classList.contains('peer-manual'),
        scan: html.classList.contains('peer-scan'),
        qr : html.classList.contains('peer-qr'),
        link : html.classList.contains('peer-link'),
        custom: html.classList.contains('peer-custom') ? 'copy' : false
      }};
    
      let param_id = location.search.replace(/^\?/,'').replace(/\&.*/,'');

      window.peerInfo = window.peerInfo || function(x){
        peerInfo.db = x;
      };

      window.peerPostMessage = function(data){
        const event = new CustomEvent("message", { data: data });
        window.dispatchEvent(event);
      };
      
      if (param_id && param_id.length===24) {
        
        payload.own_id=param_id.substr(0,12);
        payload.peer_id=param_id.substr(12);

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
  
 
  return {
    
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
  
}
