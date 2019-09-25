var screenshot = {
  content: document.createElement ('canvas'),
  data: '',

  saveScreenshot: function () {
    var image = new Image ();
    image.onload = function () {
      var canvas = screenshot.content;
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext ('2d');
      context.drawImage (image, 0, 0);

      // save the image
      var link = document.createElement ('a');
      link.download = 'skeleton.png';
      link.href = screenshot.content.toDataURL ();
      link.click ();
      screenshot.data = '';
    };
    image.src = screenshot.data;
  },

  captureVisibleTab: function () {
    chrome.tabs.captureVisibleTab (
      null,
      {
        format: 'png',
        quality: 100,
      },
      function (data) {
        screenshot.data = data;

        screenshot.saveScreenshot ();
      }
    );
  },
};

window.addEventListener ('load', OnLoad, true);

function OnLoad () {
  chrome.runtime.onMessage.addListener (BGOnMessage);
}

function BGOnMessage (request, sender, sendResponse) {
  console.log('background', request.name);
  switch (request.name) {
    case 'get_skeleton':
      sendMessage ({name: 'handle_html'});
      break;
    case 'capture_screen':
      screenshot.captureVisibleTab ();
      break;
  }
}

function sendMessage (message) {
  chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage (tabs[0].id, message, function (response) {
      console.log(response);
    });
  });
}
