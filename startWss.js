 module.exports = startWSS;  
const WebSocketServer = require('websocket').server;
let wsServer;


  function startWSS(server) {
    
    const waitingPeers = {};
    
    // create the server
  wsServer = new WebSocketServer({
    httpServer: server,
  });

  // WebSocket server
  wsServer.on("request", function (request) {
    var connection = request.accept(null, request.origin);

    connection.addEventListener("message", firstMessage);

    connection.addEventListener("close", onCloseWhileWaiting);    
    
    
    function remove(db,conn) {
      Object.keys(db).forEach(function(k){
        if (db[k]===conn) {
           delete db[k];
        }
      });
    }
    
     function onCloseWhileWaiting() {
        remove(waitingPeers,connection);
     }
    
      function firstMessage(message) {
          if (message.type === "utf8") {
            try {
              let cmd = JSON.parse(message.utf8Data);

              if (cmd.own_id && cmd.peer_id) {
                 // we are looking for a specific message with own_id and peer_id
                 // once found, stop listening for messages on this object
                 connection.removeEventListener('message',firstMessage);
                 const peerData = waitingPeers[cmd.peer_id];  
                 if (peerData) {
                    // the other connection was established first
                    // that makes this connection responsible for the linkage
                    delete waitingPeers[cmd.peer_id];
                    
                    // add linker message callbacks
                    relayMessages(peerData.connection,connection);
                    relayMessages(connection,peerData.connection);
                   
                    // all messages now directly flow between peers
                    console.log("connection etablished:",cmd);
                   
                    connection.send({webrtc:{
                      initiator: true,
                      trickle: false,
                      objectMode: false,
                      payload : cmd.payload||{}
                    }});
                    const peerCon = peerData.connection;
                    delete peerData.connection;
                    peerCon.send({webrtc:peerData});
                    return;
                 }
                
                 waitingPeers[cmd.own_id] = {
                   connection,
                   initiator: false,
                   trickle: false,
                   objectMode: false,
                   payload:cmd.payload||{}
                 };
              }

            } catch (ie) {
              console.log({ ouch: ie, data: message.utf8Data });
            } 
          }
        }
    });
    
    return  wsServer ;

    
    function relayMessages(a,b) {
        a.addEventListener('message',function(m){ 
          if(b) b.send(m.data);
        });
        b.addEventListener('close',function(m){
          b = undefined;
          a.close();       
        });
    }

}