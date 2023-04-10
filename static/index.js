

const peer = offerPeer(document.querySelector("#button1"));

peer.on('connect',function(){
  //alert('yay. peer1 connected');
  document.querySelector("#test1").disabled=false;
});

peer.on('close',function(){
  //alert('boo. peer1 disconnected');
  document.querySelector("#test1").disabled=true;
});

peer.on('data',function(data){
  document.querySelector("#in1").value=data.toString();
});

document.querySelector("#test1").onclick=function(){
   peer.send(
    "test Message" +Math.random().toString()
   );
};


const peer2 = answerPeer(document.querySelector("#button2"));

peer2.on('connect',function(){
  //alert('yay. peer2 connected');
  document.querySelector("#test2").disabled=false;
});
peer2.on('close',function(){
  document.querySelector("#test2").disabled=true;
  //alert('boo. peer2 disconnected');
});

peer2.on('data',function(data){
    document.querySelector("#in2").value=data.toString();
});

document.querySelector("#test2").onclick=function(){
   peer2.send(
    "test Message" +Math.random().toString()
   );
};


const plugin_peer = pluginPeer (mockSDApi());
  plugin_peer.on('connect',function(){
    document.querySelector("#plug_test").disabled=false;
   // alert('yay. plugin_peer connected');
  });
  
  plugin_peer.on('close',function(){
    document.querySelector("#plug_test").disabled=true;
    //alert('boo. plugin_peer disconnected');
  });
  
  plugin_peer.on('data',function(data){
    document.querySelector("#plug_in").value=data.toString();
  });
  
  document.querySelector("#plug_test").onclick=function(){
    plugin_peer.send(
      "test Message" +Math.random().toString()
     );
  };
  

 

const pi_peer  = propertyInspectorPeer(document.querySelector("#pi_button"), mockPIApi());
const app_peer = browserAppPeer(document.querySelector("#app_button"));

app_peer.on('connect',function(){
    document.querySelector("#app_test").disabled=false;
    //alert('yay. app_peer connected');
});

app_peer.on('close',function(){
    document.querySelector("#app_test").disabled=true;
    //alert('boo. app_peer disconnected');

});

app_peer.on('data',function(data){
    document.querySelector("#app_in").value=data.toString();
});

document.querySelector("#app_test").onclick=function(){
    app_peer.send(
         "test Message" +Math.random().toString()
    );
};

