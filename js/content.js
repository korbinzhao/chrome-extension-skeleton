const MOCK_TEXT_ID = 'skeleton-text-id';

// 处理 html
function handleHtml () {
  jsHandler ();

  imgsHandler ();

  aHandler ();

  // 循环遍历处理 body 的子节点
  handleNodes (document.body.childNodes);
}

// 处理节点
function handleNodes (nodes) {
  Array.from (nodes).map (node => {
    const ignore = hasAttr (node, 'data-skeleton-ignore');

    if (hasAttr (node, 'data-skeleton-bgcolor')) {
      const bgColor = node.getAttribute ('data-skeleton-bgcolor');
      node.style.backgroundColor = bgColor;
      node.style.color = 'transparent';
    } else if (ignore) {
      // do nothing
      return true;
    } else if (hasAttr (node, 'data-skeleton-empty')){
      node.innerHTML = '';

      let classNameArr = node.className && node.className.split (' ');
      let className;

      if (classNameArr) {
        classNameArr = classNameArr.map (item => {
          return '.' + item;
        });
        className = classNameArr.join ('');
      }

      const id = node.id ? '#' + node.id : '';

      const query = className || id;

      if (query) {
        let styleSheet;

        for (let item of document.styleSheets) {
          if (!item.href) {
            styleSheet = item;
            return;
          }
        }

        try {
          styleSheet &&
            styleSheet.insertRule (
              `${query}::before{content:'' !important;background:none !important;}`,
              0
            );
          styleSheet &&
            styleSheet.insertRule (
              `${query}::after{content:'' !important;background:none !important;}`,
              0
            );
        } catch (e) {
          console.error (e && e.toString ());
        }
      }
    } else if(hasAttr (node, 'view-name') && node.getAttribute('view-name') === 'ImageView') { // 兼容淘宝购物车的图片场景
      node.innerHTML = '';
      node.background = '#EEEEEE';
    } else if (
      (hasAttr (node, 'source') && hasAttr (node, 'resizemode')) ||
      (hasAttr (node, 'weex-type') &&
        node.getAttribute ('weex-type') === 'image')
    ) {
      // 标记某节点是图片节点，将该节点按图片处理，并将背景图值为空
      imgHandler(node);
    } else if (
      node.style &&
      node.style.backgroundImage &&
      node.style.backgroundImage.indexOf ('url(') === 0
    ) {
      // 节点设有背景图的情况
      node.style.background = '#EEEEEE';
    } else if (node instanceof SVGElement) {
      svgHandler (node, {
        color: '#EEEEEE',
      });
    } else if (
      node.classList &&
      node.classList.contains ('viewport') &&
      node.parentElement &&
      node.parentElement.classList &&
      node.parentElement.classList.contains ('pmod-zebra-jinkou-slide')
    ) {
      // 兼容 https://import.tmall.com/ 页面的 slider 容器 .viewport 高度问题
      node.style.height = 'auto';
    } else if (node.childNodes && node.childNodes.length > 0) {
      let isSimilarText = true; // 是否是文本节点或类文本节点（只包含注释和文本的节点）
      for (let item of node.childNodes) {
        if (item.nodeType !== 3 && item.nodeType !== 8) {
          isSimilarText = false;
        }
      }

      if (isSimilarText) {
        textHandler (node, {
          color: '#EEEEEE',
        });
      }
    }

    if (!ignore) {
      const children = node.childNodes;
      handleNodes (children);
    }
  });
}

function setOpacity (ele) {
  ele.style.opacity = 0;
}

const getTextWidth = (text, style) => {
  let offScreenParagraph = document.querySelector (`#${MOCK_TEXT_ID}`);
  if (!offScreenParagraph) {
    const wrapper = document.createElement ('p');
    offScreenParagraph = document.createElement ('span');
    Object.assign (wrapper.style, {
      width: '10000px',
      position: 'absolute',
    });
    offScreenParagraph.id = MOCK_TEXT_ID;
    wrapper.appendChild (offScreenParagraph);
    document.body.appendChild (wrapper);
  }
  Object.assign (offScreenParagraph.style, style);
  offScreenParagraph.textContent = text;
  return offScreenParagraph.getBoundingClientRect ().width;
};

// 为文本块增加遮罩
function addTextMask (
  paragraph,
  {textAlign, lineHeight, paddingBottom, paddingLeft, paddingRight},
  maskWidthPercent = 0.5
) {
  let left;
  let right;
  switch (textAlign) {
    case 'center':
      left = document.createElement ('span');
      right = document.createElement ('span');
      [left, right].forEach (mask => {
        Object.assign (mask.style, {
          display: 'inline-block',
          width: `${maskWidthPercent / 2 * 100}%`,
          height: lineHeight,
          background: '#fff',
          position: 'absolute',
          bottom: paddingBottom,
        });
      });
      left.style.left = paddingLeft;
      right.style.right = paddingRight;
      paragraph.appendChild (left);
      paragraph.appendChild (right);
      break;
    case 'right':
      left = document.createElement ('span');
      Object.assign (left.style, {
        display: 'inline-block',
        width: `${maskWidthPercent * 100}%`,
        height: lineHeight,
        background: '#fff',
        position: 'absolute',
        bottom: paddingBottom,
        left: paddingLeft,
      });
      paragraph.appendChild (left);
      break;
    case 'left':
    default:
      right = document.createElement ('span');
      Object.assign (right.style, {
        display: 'inline-block',
        width: `${maskWidthPercent * 100}%`,
        height: lineHeight,
        background: '#fff',
        position: 'absolute',
        bottom: paddingBottom,
        right: paddingRight,
      });
      paragraph.appendChild (right);
      break;
  }
}

function aHandler () {
  // a 标签处理
  Array.from (document.querySelectorAll ('a')).map (a => {
    a.href = 'javascript:void(0);';
  });
}

// 文本处理
function textHandler (ele, {color}) {
  const {width} = ele.getBoundingClientRect ();
  // 宽度小于 50 的元素就不做阴影处理
  if (width <= 50) {
    return setOpacity (ele);
  }
  const comStyle = window.getComputedStyle (ele);
  const text = ele.textContent;
  let {
    lineHeight,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    position: pos,
    fontSize,
    textAlign,
    wordSpacing,
    wordBreak,
  } = comStyle;

  if (!/\d/.test (lineHeight)) {
    const fontSizeNum = parseInt (fontSize, 10) || 14;
    lineHeight = `${fontSizeNum * 1.4}px`;
  }

  const position = ['fixed', 'absolute', 'flex'].find (p => p === pos)
    ? pos
    : 'relative';

  const height =
    ele.offsetHeight -
    parseInt (getComputedStyle (ele).paddingTop) -
    parseInt (getComputedStyle (ele).paddingBottom);
  
  // 向下取整
  let lineCount =
    parseInt((height - parseInt (paddingTop, 10) - parseInt (paddingBottom, 10)) /
    parseInt (lineHeight, 10)); // eslint-disable-line no-bitwise

  lineCount = lineCount < 1 ? 1 : lineCount;

  const textHeightRatio = lineHeight / (height / lineCount) || 0.6;

  // 添加文本块类名标记
  ele.classList.add ('skeleton-text-block-mark');

  /* eslint-disable no-mixed-operators */
  Object.assign (ele.style, {
    backgroundImage: `linear-gradient(
                        transparent ${(1 - textHeightRatio) / 2 * 100}%,
                        ${color} 0%,
                        ${color} ${((1 - textHeightRatio) / 2 + textHeightRatio) * 100}%,
                        transparent 0%)`,
    backgroundSize: `100% ${(height / lineCount)}px`,
    position,
    height: 'auto',
  });

  /* eslint-enable no-mixed-operators */
  // add white mask
  if (lineCount > 1) {
    addTextMask (
      ele,
      Object.assign (JSON.parse (JSON.stringify (comStyle)), {
        lineHeight,
      })
    );
  } else {
    const textWidth = getTextWidth (text, {
      fontSize,
      lineHeight,
      wordBreak,
      wordSpacing,
    });
    const textWidthPercent =
      textWidth /
      (width - parseInt (paddingRight, 10) - parseInt (paddingLeft, 10));
    ele.style.backgroundSize = `${textWidthPercent * 100}% ${lineHeight}px`;

    switch (textAlign) {
      case 'left': // do nothing
        break;
      case 'center':
        ele.style.backgroundPositionX = '50%';
        break;
      case 'right':
        ele.style.backgroundPositionX = '100%';
        break;
    }
  }
}

function jsHandler () {
  // 将 js 脚本移除
  const scripts = Array.from (document.querySelectorAll ('script'));
  for (const script of scripts) {
    try {
      if (script) {
        script.parentElement.removeChild (script);
      }
    } catch (e) {
      console.error ('script handler error: ' + e.toString ());
      script.innerHTML = '';
    }
  }
}

function imgsHandler () {
  // 图片处理
  Array.from (document.querySelectorAll ('img')).map (img => {
    imgHandler (img);
  });
}

function imgHandler (img) {
  img.style.display = 'inline-block';
  img.style.width = img.offsetWidth + 'px';
  img.style.height = img.offsetHeight + 'px';
  img.src =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  img.style.backgroundColor = '#EEEEEE';
  img.style.backgroundImage = '';
}

// svg 处理
function svgHandler (ele, {color}) {
  if (ele.getAttribute ('hidden') === 'true') {
    return removeElement (ele);
  } else {
    ele.innerHTML = '';
    ele.style.backgroundColor = color;
  }
}

function removeElement (ele) {
  ele.parentElement && ele.parentElement.removeChild (ele);
}

function hasAttr (ele, attr) {
  try {
    return ele.hasAttribute (attr);
  } catch (e) {
    return false;
  }
}

function skeletonOperator() {

  const skeletonOperatorStyle = document.createElement('style');
  skeletonOperatorStyle.innerHTML = 'html{overflow-x:hidden;}.skeleton-operator-focus,.skeleton-operator-mouseover{opacity: 1 !important;box-sizing: border-box !important;} .skeleton-operator-focus{border: 1px solid red !important;opacity: 1 !important;}' +
    '.skeleton-operator-mouseover{border: 1px solid orange !important; }';
  document.head.appendChild(skeletonOperatorStyle);

  document.addEventListener('mouseover', elementFocusHandler);
  document.addEventListener('mousedown', elementFocusHandler);
  document.addEventListener('mouseout', removeSkeletonOperatorMouseover);

  window.addEventListener('message', function (rs) {
    var data = rs.data;

    if (!data) {
      return false;
    }

    const focusedElement = document.querySelector('.skeleton-operator-focus');

    focusedElement && focusedElement.classList.remove('skeleton-operator-focus');

    switch (data.type) {
      case 'remove':
        removeElementFocused(focusedElement);
        break;
      case 'empty':
        emptyElementFocused(focusedElement);
        break;
      case 'hide':
        hideElementFocused(focusedElement);
        break;
      case 'resetBgcolor':
        setElementFocusedBgcolor(focusedElement, data.bgColor);
        break;
    }

  })

  function elementFocusHandler(e) {
    const target = e.target;
    const type = e.type;

    let className = 'skeleton-operator-mouseover';

    if (type === 'mousedown') {
      className = 'skeleton-operator-focus';
    }

    const currentFocusElement = document.querySelector('.' + className);
    if (currentFocusElement === target && type === 'mousedown') { // 在已选中的element上点击，取消选中
      currentFocusElement.classList.remove(className);
    } else {
      const elements = document.querySelectorAll('.' + className);

      for (let ele of elements) {
        ele.classList.remove(className);
      }

      target.classList.add(className);

    }

  }

  function removeSkeletonOperatorMouseover(e) {
    const target = e.target;
    target.classList.remove('skeleton-operator-mouseover')
  }

  function removeElementFocused(focusedElement) {

    focusedElement && focusedElement.parentElement && focusedElement.parentElement.removeChild(focusedElement);
  }

  function emptyElementFocused(focusedElement) {

    if (focusedElement) {
      focusedElement.innerHTML = '';
      focusedElement.classList.remove('skeleton-operator-focus');
    }

  }

  function hideElementFocused(focusedElement) {
    if (focusedElement) {
      focusedElement.style.visibility = 'hidden';
    }
  }

  function setElementFocusedBgcolor(focusedElement, color) {

    if (focusedElement) {
      focusedElement.setAttribute('data-skeleton-bgcolor', color);
      focusedElement.style.background = color;
      focusedElement.style.opacity = 1;
      focusedElement.classList.remove('skeleton-operator-focus');
    }
  }


}


function onMessage (request, sender, sendResponse) {
  console.log ('content: onMessage ' + request.name);

  if (request.name === 'handle_html') {
    handleHtml ();
    sendResponse ({message: 'handleHtml success'});
  }
}

function sendMessage () {
  chrome.runtime.sendMessage ({greeting: 'hello'}, function (response) {
    console.log (response.farewell);
  });
}

function onLoad () {
  console.log ('contentjs onload', chrome.runtime.onMessage);
  chrome.runtime.onMessage.addListener (onMessage);
  // skeletonOperator();
}

window.addEventListener ('load', onLoad, false);
