/* global SimplePeer,QRCode */

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


window.enter_peer_id = document.querySelector("#enter_peer_id");
const show_own_id = document.querySelector("#show_own_id");
const connections = document.querySelector("#connections");
const connect_info = document.querySelector("#connect_info");
const logview = document.querySelector("#log");
const reset_btn = document.querySelector('#reset_btn');
const copy_btn = document.querySelector('#copy_btn');
const qr_btn = document.querySelector('#qr_btn');
const custom_btn = document.querySelector('#custom_btn');
const scan_btn = document.querySelector('#scan_btn');

const qrCode = document.querySelector("#qrcode");

window.log = function log() {
  //if (framed) return;
  logview.innerHTML += [].map.call(arguments, function (a) {
    return a ? a.toString() : "";
  }).join(" ") + "<br>";
}

reset_btn.onclick = function () {
  sessionStorage.clear();
  location.reload();
};

copy_btn.onclick = function () {
  sessionStorage.clear();
  let new_peer_id = cleanupId(inventId());
  sessionStorage.clear();
  own_id = inventId();
  own_id_clean = cleanupId(own_id);
  show_own_id.innerHTML = formatId(own_id);

  savePeerId(new_peer_id);
  let share_url = target_href + '?' + new_peer_id + own_id_clean;
  navigator.clipboard.writeText(share_url);
  enter_peer_id.value = formatId(new_peer_id);
  if (typeof window.parent.peerInfo==='function') {
      window.parent.peerInfo ( {
        url : share_url,
        own_id : own_id,
        peer_id : new_peer_id,
        customurl : function(baseurl) {
          return baseurl + '?' + new_peer_id + own_id_clean;
        }
      });
  }
  setTimeout(peer_id_changed, 500);
  logview.innerHTML = "";
  log('the link is: ' + share_url + '\n\n' +
    'it has been copied to the clipboard.\n\n' +
    'send it to the other device (via email/sms/dm )\n\n' +
    'and open it there to link the devices'
  );
}

qr_btn.onclick = function (e) {
  sessionStorage.clear();
  let new_peer_id = cleanupId(inventId());
  sessionStorage.clear();
  own_id = inventId();
  own_id_clean = cleanupId(own_id);
  show_own_id.innerHTML = formatId(own_id);
  savePeerId(new_peer_id);
  share_url = target_href + '?' + new_peer_id + own_id_clean;
  //navigator.clipboard.writeText(share_url);
  enter_peer_id.value = new_peer_id;
  setTimeout(peer_id_changed, 500);
  logview.innerHTML = "";
  qrCode.style.display = "block";
  qrCode.innerHTML = "<h1>Scan with cameraphone to link it to this screen <button> X </button> </h1>";
  let qr = new QRCode(qrCode, share_url);
  const btns = qrCode.querySelector("button");
  btns.onclick = CloseClick;
}

function CloseClick() {
  qrCode.style.display = "none";
  qrCode.innerHTML = "";
}

scan_btn.onclick = function () {
  window.parent.location.href = "https://scan.1mb.site";
}

custom_btn.onclick = function () {
  sessionStorage.clear();
  own_id = '';
  own_id_clean = cleanupId(own_id);
  show_own_id.innerHTML = formatId(own_id);

  connect_info.style.display = "none";

  let test_peer = offerPeer(custom_btn);
  test_peer.on('connect',function(){
     log('connected ok');
  });

  /*

  // make a random id to paste into custom app
  let customId = (randomId() + randomId()).replace(/\-/g, '');

  savePeerId('');
  let cliptext = custom_btn.value.replace(/\s/g, '') + ':' + customId;
  navigator.clipboard.writeText(cliptext);

  enter_peer_id.value = '';
  logview.innerHTML = "";
  log('the custom id is : ' + customId + '\n\n' +
    'it has been copied to the clipboard.\n\n'
  );

  customConnect(customId); */
}


show_own_id.innerHTML = formatId(own_id);
peer.on("signal", function (data) {
  peer._signal_data = data;
});

peer.on("error", function (err) {
  log("error", err);
  setTimeout(location.reload.bind(location), 1000);
});

let prior_peer = sessionStorage.getItem("peer-id");
if (prior_peer) {
  enter_peer_id.value = prior_peer;
  setTimeout(peer_id_changed, 500);
} else {
  enter_peer_id.onkeyup = peer_id_changed;
  //enter_peer_id.oninput  = peer_id_changed;
  enter_peer_id.onchange = peer_id_changed;
}


function updateFrameIUOptions(opt){

  if (opt) {

    if (opt.target_href) {
      target_href = opt.target_href;
    }
    
    // truthy options will display the associated buttons
    reset_btn.style.display = !!opt.manual ? "inline-block" : "none";
    copy_btn.style.display = !!opt.link ? "inline-block" : "none";
    qr_btn.style.display = !!opt.qr ? "inline-block" : "none";
    custom_btn.style.display = !!opt.custom ? "inline-block" : "none";
    scan_btn.style.display = !!opt.scan ? "inline-block" : "none";

    // opt.custom can be true (meaning use the default label of "Custom")
    // or a string which supplies the label
    if (typeof opt.custom === 'string') {
      custom_btn.value = opt.custom;
      custom_btn.innerHTML = opt.custom;

    }

  }

 

}

 
function peer_id_changed(ev) {
  if (ev && ev.key === "Backspace") return;

  let peer_id = cleanupId(enter_peer_id.value);
  let id = formatId(enter_peer_id.value);

  enter_peer_id.value = id;

  if (validateId(peer_id)) {
    if (peer_id === own_id_clean) {
      log("can't connect to the same browser!");
      enter_peer_id.style.backgroundColor = "red";
    } else {
      enter_peer_id.onkeyup = null;
      enter_peer_id.oninput = null;
      enter_peer_id.onchange = null;

      savePeerId(peer_id);

      if (Number(peer_id) < Number(own_id_clean)) {
        log("listening for peer connect");
        listenForPeer();
      } else {
        log("connecting to peer");
        connectToPeer();
      }
      enter_peer_id.style.backgroundColor = "lime";
    }
  } else {
    enter_peer_id.style.backgroundColor =
      peer_id.length === 3 + 4 + 5 ? "red" : "white";
  }
}




