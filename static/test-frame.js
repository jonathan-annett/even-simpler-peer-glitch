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
          peerViaWsBtn =  document.querySelector("#peerViaWsBtn"),
          logger = document.querySelector("pre"),
          json = document.querySelector("textarea"),
          btn = document.querySelector("button");
      
      //document.body.appendChild(logger);
      document.body.onload=function(){
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
        });
        
         
        peer.on('error',function(err){
          document.title = "error";
          document.querySelector("iframe").style.display = "block";
          log(err);
        });
        
        btn.onclick = function(){
           try {
             let msg = JSON.parse(json.value);
             peerSend(msg);
             json.value = JSON.stringify(msg,undefined,4);
           } catch (e) {
             
           }
        };


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



      
