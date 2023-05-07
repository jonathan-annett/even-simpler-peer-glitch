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

/* global evenSimplerPeer,evenSimplerWSPeer */   

      let peer,
          tickCount =0,
          peerViaWsBtn =  document.querySelector("#peerViaWsBtn"),
          logger = document.querySelector("pre"),
          json = document.querySelector("textarea"),
          btn = document.querySelector("#sendBtn"),
          rest_test = document.querySelector("#rest_test");
          
      
      //document.body.appendChild(logger);
      document.body.onload=function(){
        
        if (checkWs()) return;
        
        peer = evenSimplerPeer();
        
        let peerSend = function (msg) {
          peer.send(msg);
          logger.innerHTML += "out:"+JSON.stringify(msg,undefined,4)+"\n";
        };
        
        peer.on('connect',function(){
          document.title = "connected";
          peerSend({hello:"world"});
          document.querySelector("iframe").style.display = "none";
        });
        
        peer.on('message',function(msg){
          logger.innerHTML += "in: "+JSON.stringify(msg,undefined,4)+"\n";
        });
        
        peer.on('close',function(){
          document.title = "disconnected";
          document.querySelector("iframe").style.display = "block";
          logger.innerHTML += "closed\n";
        });
        
         
        peer.on('error',function(err){
          document.title = "error";
          document.querySelector("iframe").style.display = "block";
          
          logger.innerHTML += "error: "+JSON.stringify(err,undefined,4)+"\n";
        });
        
        btn.onclick = function(){
           try {
             let msg = JSON.parse(json.value);
             peerSend(msg);
             json.value = JSON.stringify(msg,undefined,4);
           } catch (e) {
             
           }
        };


 
        function checkWs () {
          
          const info = getWebRTCInfo();
          if (info) {
             if (peer) peer.destroy();
            
             const custXhr = customXhr('x-rest-token',info.peer_id+info.own_id);

             peer = evenSimplerWSPeer(info);

             peer.on('data',function(msg,source){
               logger.innerHTML += source+": "+JSON.stringify(msg,undefined,4)+"\n";
             });
            
             peer.on('rest',function(msg){
               logger.innerHTML = "rest : "+JSON.stringify(msg,undefined,4)+"\n";
             });
            
            

             btn.onclick = function(){
              try {
                let msg = JSON.parse(json.value);
                logger.innerHTML += "sending: "+JSON.stringify(msg,undefined,4)+"\n";
                peer.send(msg);
                json.value = JSON.stringify(msg,undefined,4);
              } catch (e) {

              }
           };
            
             setInterval(function(){
               
               if (peer) {
                 peer.send({

                     random:Math.random(),
                     when:Date.now(),
                     tickCount:tickCount++

                   });
                 }
               
               
             },5000);
            
             rest_test.onkeyup=function(e){
                if (e.key==="Enter") {
                   const xhr = custXhr();
                   xhr.open('GET',location.origin+'/wss_rest.api?'+rest_test.value,false);
                  
                   xhr.send();
                  rest_test.value="";
                }
             };

             return true;
          }
          
          return false;
        }
        
        
        function getWebRTCInfo() {
            let token = location.search,{validateId} = evenSimplerPeer;
            if (token && token.startsWith('?webrtc=')  ) {
               token=token.split('=')[1];
               if (token.length===24) {
                 const own_id = token.substr(0,12);
                 const peer_id = token.substr(12,12);
                 if (validateId(own_id) && validateId(peer_id)) {
                     return  {own_id, peer_id } ;
                 }
              }
            }
          
          return null;
        }
      };

   function customXhr(hdr,value) {
        return function () { 
          var ajax = new XMLHttpRequest() ;
          const realOpen = ajax.open;

          // steal the 'open' function, since the request has o be open
          // in order to send headers
          ajax.open = function(method, url){
              realOpen.apply(ajax, arguments);

              // note: here, yu have access to the method (GET, POST, etc.), as well
              // as the url for the request... so 'if' to your content

              // automatically send the header once open
              ajax.setRequestHeader(hdr,value);
          };

          return ajax;
        };
   }
 
        peerViaWsBtn.onclick = function () {
          const token = location.search;
          if (token && token.length === 25 && token.charAt(0)==='?') {
             const own_id = token.substr(1,12);
             const peer_id = token.substr(13,12);
             if (evenSimplerPeer.validateId(own_id)) {
                if (evenSimplerPeer.validateId(peer_id)) {
                   if (peer) peer.destroy();

                   peer = evenSimplerWSPeer({own_id, peer_id });
                   peer.on('data',function(msg){
                    logger.innerHTML += "in: "+JSON.stringify(msg,undefined,4)+"\n";
                   });

                   btn.onclick = function(){
                    try {
                      let msg = JSON.parse(json.value);
                      peer.send(msg);
                      json.value = JSON.stringify(msg,undefined,4);
                    } catch (e) {
                      
                    }
                 };
         

                }
             }
          }
          
        }
      };



      
 
