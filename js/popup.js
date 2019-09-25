function sendMessage(message){
  chrome.runtime.sendMessage(message, function (response) {
    if (!response) {
        console.log("Empty response!!!");
        return;
    }
    console.log("CS: response message = " + response.message);
});
}

var skeletonBtn = document.querySelector('#skeleton-btn');
var captureBtn = document.querySelector('#capture-btn');

skeletonBtn.addEventListener('click', function(){
  sendMessage({"name": "get_skeleton"});
});

captureBtn.addEventListener('click', function(){
  sendMessage({"name": "capture_screen"});
});