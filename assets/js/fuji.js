'use strict';
import * as params from "@params";

// get current theme
function getNowTheme() {
  let nowTheme = document.body.getAttribute('data-theme');
  if (nowTheme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    return nowTheme === 'dark' ? 'dark' : 'light';
  }
}

// load comment button only when comment area exist
if (document.querySelector('span.post-comment-notloaded')) {
  document.querySelector('span.post-comment-notloaded').addEventListener('click', loadComment);
}

// to-top button
document.querySelector('.btn .btn-scroll-top').addEventListener('click', () => {
  document.documentElement.scrollTop = 0;
});

document.addEventListener('DOMContentLoaded', () => {
  if (typeof mediumZoom === 'function') {
    mediumZoom('.img-zoomable', {
      margin: 32,
      background: '#00000054',
      scrollOffset: 128,
    });
  }
});

// update utterances theme
function updateUtterancesTheme(utterancesFrame) {
  let targetTheme = getNowTheme();
  if (utterancesFrame) {
    if (targetTheme === 'dark') {
      utterancesFrame.contentWindow.postMessage(
        {
          type: 'set-theme',
          theme: 'photon-dark',
        },
        'https://utteranc.es'
      );
    } else {
      utterancesFrame.contentWindow.postMessage(
        {
          type: 'set-theme',
          theme: 'github-light',
        },
        'https://utteranc.es'
      );
    }
  }
}

// theme switch button
document.querySelector('.btn .btn-toggle-mode').addEventListener('click', () => {
  let nowTheme = getNowTheme();
  let domTheme = document.body.getAttribute('data-theme');
  const needAuto = document.body.getAttribute('data-theme-auto') === 'true';
  let systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  if (domTheme === 'auto') {
    // if now in auto mode, switch to user mode
    document.body.setAttribute('data-theme', nowTheme === 'light' ? 'dark' : 'light');
    localStorage.setItem('fuji_data-theme', nowTheme === 'light' ? 'dark' : 'light');
  } else if (domTheme === 'light') {
    const tar = systemTheme === 'dark' ? (needAuto ? 'auto' : 'dark') : 'dark';
    document.body.setAttribute('data-theme', tar);
    localStorage.setItem('fuji_data-theme', tar);
  } else {
    const tar = systemTheme === 'light' ? (needAuto ? 'auto' : 'light') : 'light';
    document.body.setAttribute('data-theme', tar);
    localStorage.setItem('fuji_data-theme', tar);
  }

  // switch comment area theme
  // if this page has comment area
  let commentArea = document.querySelector('.post-comment');
  if (commentArea) {
    // if comment area loaded
    if (document.querySelector('span.post-comment-notloaded').getAttribute('style')) {
      if (commentArea.getAttribute('data-comment') === 'utterances') {
        updateUtterancesTheme(document.querySelector('.post-comment iframe'));
      }
      if (commentArea.getAttribute('data-comment') === 'disqus') {
        DISQUS.reset({
          reload: true,
        });
      }
    }
  }
});

// search by fuse.js
var fuseOptions = {
  tokenize: true,
  matchAllTokens: true,
  includeMatches: true,
  includeScore: true,
  shouldSort: true,
  ignoreLocation: true,
  location: 0,
  distance: 100,
  threshold: 0.3,
  minMatchCharLength: 2,
  maxPatternLength: 64,
  keys: [
    {
      name: 'title',
      weight: 0.8,
    },
    {
      name: 'tags',
      weight: 0.3,
    },
    {
      name: 'content',
      weight: 0.5,
    },
  ],
};

// Override search options with site params
if (params.fuseOpts) {
    var fuseOptions = {
        isCaseSensitive: params.fuseOpts.iscasesensitive ? params.fuseOpts.iscasesensitive : false,
        includeScore: params.fuseOpts.includescore ? params.fuseOpts.includescore : false,
        includeMatches: params.fuseOpts.includematches ? params.fuseOpts.includematches : false,
        minMatchCharLength: params.fuseOpts.minmatchcharlength ? params.fuseOpts.minmatchcharlength : 2,
        shouldSort: params.fuseOpts.shouldsort ? params.fuseOpts.shouldsort : true,
        findAllMatches: params.fuseOpts.findallmatches ? params.fuseOpts.findallmatches : false,
        keys: params.fuseOpts.keys ? params.fuseOpts.keys : [
          {
            name: 'title',
            weight: 0.8,
          },
          {
            name: 'tags',
            weight: 0.3,
          },
          {
            name: 'content',
            weight: 0.5,
          },
        ],
        location: params.fuseOpts.location ? params.fuseOpts.location : 0,
        threshold: params.fuseOpts.threshold ? params.fuseOpts.threshold : 0.4,
        distance: params.fuseOpts.distance ? params.fuseOpts.distance : 100,
        ignoreLocation: params.fuseOpts.ignorelocation ? params.fuseOpts.ignorelocation : true,
        maxPatternLength: params.fuseOpts.maxPatternLength ? params.fuseOpts.maxPatternLength : 64
    }
}

function searchAll(key, index, counter) {
  let fuse = new Fuse(index, fuseOptions);
  let result = fuse.search(key);
  console.log(result);
  if (result.length > 0) {
    document.getElementById('search-result').innerHTML = template('search-result-template', result);
    if (params.enableHighlights) {
      highlightResults(result, key);
    }
    return [new Date().getTime() - counter, result.length];
  } else {
    return 'notFound';
  }
}

function highlightResults(result, search_key) {
  result.forEach(function (value, index) {
    var snippetHighlights = [];
    if (fuseOptions.tokenize) {
      value.matches.forEach(function (matchValue) {
        if (matchValue.key == "title" || matchValue.key == "tags") {
          snippetHighlights.push(search_key);
        }
      });
    }
    snippetHighlights.forEach(function (value) {
      new Mark([
        document.getElementById("search-result-title-" + index),
        document.getElementById("search-result-tags-" + index)
      ]).mark(value);
    });
  });
}

let urlParams = new URLSearchParams(window.location.search); // get params from URL
if (urlParams.has('s')) {
  let counter = new Date().getTime();
  let infoElements = document.querySelectorAll('.search-result-info');
  let key = urlParams.get('s'); // get search keyword, divided by space
  document.querySelector('.search-input input').setAttribute('value', key);
  // console.log(key);
  // get search index from json
  let xhr = new XMLHttpRequest();
  // console.log(xhr);
  xhr.open('GET', 'index.json', true);
  xhr.responseType = 'json';
  xhr.onerror = () => {
    infoElements[2].removeAttribute('style');
  };
  xhr.ontimeout = () => {
    infoElements[2].removeAttribute('style');
  };
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // use index json to search
        // console.log(xhr.response);
        counter = searchAll(key, xhr.response, counter);
        // console.log(counter);
        if (counter === 'notFound') {
          infoElements[1].removeAttribute('style');
        } else {
          infoElements[0].innerHTML = infoElements[0].innerHTML.replace('[TIME]', counter[0]);
          infoElements[0].innerHTML = infoElements[0].innerHTML.replace('[NUM]', counter[1]);
          infoElements[0].removeAttribute('style');
        }
      } else {
        infoElements[2].removeAttribute('style');
      }
    }
  };
  xhr.send(null);
}

/* mobile menu  */
const openMenu = document.getElementById('btn-menu');
if (openMenu) {
  openMenu.addEventListener('click', () => {
    const menu = document.querySelector('.sidebar-mobile');
    if (menu) {
      if (menu.style.display === 'none') {
        menu.setAttribute('style', 'display: flex;');
      } else {
        menu.setAttribute('style', 'display: none;');
      }
    }
  });
}
