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

/* global evenSimplerPeer */   

      let peer,
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
        
        peer.on('connected',function(){
          document.title = "connected";
          peerSend({hello:"world"});
          document.querySelector("iframe").style.display = "none";
        });
        
        peer.on('message',function(msg){
          logger.innerHTML += "in: "+JSON.stringify(msg,undefined,4)+"\n";
        });
        
        peer.on('disconnected',function(){
          document.title = "disconnected";
          document.querySelector("iframe").style.display = "block";
        });
        
        
        btn.onclick = function(){
           try {
             let msg = JSON.parse(json.value);
             peerSend(msg);
             json.value = JSON.stringify(msg,undefined,4);
           } catch (e) {
             
           }
        };
      };
      
