var numkeys  = {};
var numkey_poll = {};

const maxAge = 1000*60*60*30; 


//
// This defines the routes that our API is going to use.
//
var routes = function (app) {
  //
  // This route processes GET requests, by using the `get()` method in express, and we're looking for them on
  // the root of the application (in this case that's https://rest-api.glitch.me/), since we've
  // specified `"/"`.  For any GET request received at "/", we're sending some HTML back and logging the
  // request to the console. The HTML you see in the browser is what `res.send()` is sending back.
  //
  
  app.get("/", function (req, res) {
    res.send({ info: "This is a rest api. Thanks for looking though!" });
  });
  
  app.get("/version", function (req, res) {
    res.send({ server: process.github_rev });
  });
  
  
  app.get ("/api",function(req,res){
      res.sendFile(__dirname + "/static/even-simpler-api.html");
  });
  app.post ("/api",function(req,res){
        
    numKeyCleanup ();

    if (req.body.set) {
      
         const polled = numkey_poll[req.body.set.id];

         numkeys[req.body.set.id] = {
            touched : Date.now(),
            data    : req.body.set.data
        };
      
         if (polled && polled.send && polled.timeout) {
           
            clearTimeout(polled.timeout);
            delete polled.timeout;
            polled.send(req.body.set.data);
            delete polled.send;
           
            delete numkey_poll[req.body.set.id];
            //delete numkeys[req.body.set.id].data;
            //delete numkeys[req.body.set.id];
            console.log("post.set sent to polled get:",req.body.set.id);
            return res.send("\"sent\"");
         }

         
         console.log("post.set saved for pending get:",req.body.set.id);
         return res.send("\"pending\"");

    }
    
    if (req.body.get) {

         let query = numkeys[req.body.get];
         if (query) {
           res.send(query.data);
           console.log("post.get:",req.body.get);
           //delete query.data;
           //delete numkeys[req.body.get];
           return;
         }
      
         numkey_poll[req.body.get] = {
           send : res.send.bind(res),
           timeout : setTimeout(function(){
                if (numkey_poll[req.body.get]) {
                  delete numkey_poll[req.body.get].timeout;
                  delete numkey_poll[req.body.get].send;
                  delete numkey_poll[req.body.get];
                  res.send(false);           
                }
           },5000)
         };
         //console.log("polling post.get:",req.body.get);

    }
        
  });
  
  
  
  function numKeyCleanup () {
    if (numKeyCleanup.timeout) {
      clearTimeout(numKeyCleanup.timeout);
      delete numKeyCleanup.timeout;
    }
    
    let keys = Object.keys(numkeys);
        
    if (keys.length===0) return;
    let before = Date.now()-60000;
    keys.forEach(function(k) {
      
      if (numkeys[k].touched < before) {
         delete numkeys[k];
      }
      
    });
    
    keys = Object.keys(numkeys);
    
    //console.log("keys active @ ",new Date(), keys);
    
    numKeyCleanup.timeout = setTimeout(numKeyCleanup,60000);
    
  }


};

module.exports = routes;
