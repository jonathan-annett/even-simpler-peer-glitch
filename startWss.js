 module.exports = startWSS;  
const WebSocketServer = require('websocket').server;
let wsServer;


  function startWSS(server,app) {
    
    app.get('/wss_rest.api',function(req,res){
       const token = req.headers['x-rest-token'];
       if (token) {
         console.log("got token:",token);
          const rest = wss_rests[token];
          if (rest) {
             const json = JSON.stringify({rest:req.url});
             console.log('sending to websocket',json);
             res.end('true');
             rest.send(json);
             return ;
          }
       }
       res.end('false'); 
    });
    
    const waitingPeers = {};
    const wss_rests = {};
    
    // create the server
  wsServer = new WebSocketServer({
    httpServer: server,
  });

  // WebSocket server
  wsServer.on("request", function (request) {
    var connection = request.accept(null, request.origin);
    
    console.log("got connection");
   
    connection.addListener("message", firstMessage);

    connection.addListener("close", onCloseWhileWaiting);     
    
    
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
                 connection.removeListener('message',firstMessage);
                 const peerData = waitingPeers[cmd.peer_id];  
                 if (peerData) {
                    // the other connection was established first
                    // that makes this connection responsible for the linkage
                    delete waitingPeers[cmd.peer_id];
                     
                    // add linker message callbacks
                    relayMessages(peerData.connection,connection);
                    relayMessages(connection,peerData.connection);
                   
                    wss_rests [ cmd.peer_id+cmd.own_id ] = peerData.connection;
                    wss_rests [ cmd.own_id+cmd.peer_id ] = connection;
                   
                    peerData.connection.addListener('close',function(){
                       delete wss_rests [ cmd.peer_id+cmd.own_id ];
                    });
                    connection.addListener('close',function(){
                       delete wss_rests [ cmd.own_id+cmd.peer_id ];
                    });
                   
                   
                    // all messages now directly flow between peers
                   
                    connection.send(JSON.stringify({webrtc:{
                      initiator: true,
                      trickle: true,
                      objectMode: false,
                      payload : cmd.payload||{}
                    }}));
                    const peerCon = peerData.connection;
                    delete peerData.connection; 
                    peerCon.send(JSON.stringify({webrtc:peerData}));
                    return;
                 }
                
                 console.log("waiting for second peer:",cmd);
                 waitingPeers[cmd.own_id] = {
                   connection,
                   initiator: false,
                   trickle: true,
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
      
        a.addListener('message',function(m){ 
           if(b) b.send(m.utf8Data);
        });
        b.addListener('close',function(m){
          b = undefined;
          a.close();       
        });
    }

}