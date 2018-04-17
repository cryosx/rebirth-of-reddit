const navbarList = document.getElementById('navbar_list');
// const contentHeader = document.getElementById('content_header');
// const contentContainer = document.getElementById('content');
const main = document.getElementsByTagName('main')[0];

const urlBase = 'https://www.reddit.com/r/';

let afterSub = null;
let currentSub = null;
let preloader = null;
let contentHeader = null;
let contentContainer = null;

const timeFactors = [
  { factor: 1000, unit: 'millisecond' },
  { factor: 60, unit: 'second' },
  { factor: 60, unit: 'minute' },
  { factor: 24, unit: 'hour' },
  { factor: 30, unit: 'day' },
  { factor: 12, unit: 'month' },
  { factor: Number.MAX_SAFE_INTEGER, unit: 'year' }
];

window.onscroll = function() {
  if (window.scrollY >= document.body.clientHeight - window.innerHeight) {
    if (window.scrollY > window.innerHeight) {
      if (afterSub && currentSub) {
        fetchData(`${currentSub}`, `?after=${afterSub}`);
      }
    }
  }
};

build(['random', 'hawaii', 'anime', 'eyebleach']);

function buildContentHeader() {
  let contentHeader = document.createElement('div');
  contentHeader.id = 'content_header';
  return contentHeader;
}

function buildContentContainer() {
  let contentContainer = document.createElement('div');
  contentContainer.id = 'content';
  return contentContainer;
}

function usePreloader(preloader) {
  main.innerHTML = '';
  main.appendChild(preloader);
}

function buildPreloader(target) {
  let holder = document.createElement('div');
  let flipPreloader = document.createElement('div');
  holder.className = 'holder';
  flipPreloader.className = 'flip-preloader example-1';
  for (let i = 0; i < 5; i++) {
    flipPreloader.appendChild(document.createElement('div'));
  }
  holder.appendChild(flipPreloader);
  return holder;
}

function build(subreddits) {
  preloader = buildPreloader();
  contentHeader = buildContentHeader();
  contentContainer = buildContentContainer();

  getRandom();

  buildNav(subreddits);
}

function buildNav(subreddits) {
  subreddits.forEach(function(elem) {
    let listItem = document.createElement('li');
    listItem.innerText = elem.toUpperCase();
    navbarList.appendChild(listItem);
    listItem.onclick = function() {
      usePreloader(preloader);
      contentContainer.innerHTML = '';
      if (elem === 'random') {
        getRandom();
      } else {
        fetchData(elem, '');
      }
    };
  });
}

function getRandom() {
  usePreloader(preloader);
  let request = new XMLHttpRequest();
  request.onload = function() {
    let response = JSON.parse(this.response);
    let subreddits = response.data.children;
    let random = Math.floor(Math.random() * subreddits.length);
    fetchData(subreddits[random].data.display_name, '');
  };
  request.open(
    'GET',
    getJsonURL('reddits', '?limit=100', 'https://www.reddit.com/')
  );
  request.send();
}

function fetchData(subreddit, query) {
  contentHeader.innerHTML = '';
  let subredditHeader = document.createElement('div');
  subredditHeader.className = 'subreddit_header';
  subredditHeader.innerText = subreddit.toUpperCase();
  contentHeader.appendChild(subredditHeader);
  let request = new XMLHttpRequest();
  request.onload = function() {
    let response = JSON.parse(this.response);
    let posts = response.data.children;
    afterSub = response.data.after;
    currentSub = subreddit;
    posts.forEach(function(elem) {
      let card = document.createElement('div');
      let cardHeader = document.createElement('div');
      let cardHeaderImg = document.createElement('img');
      let cardContent = document.createElement('div');
      let cardContentTitle = document.createElement('div');
      let cardContentList = document.createElement('ul');
      let cardContentScore = document.createElement('li');
      let cardContentAuthor = document.createElement('li');
      let cardContentDate = document.createElement('li');
      let cardContentBody = document.createElement('div');

      card.className = 'card';
      cardHeader.className = 'card_header';
      cardContent.className = 'card_content';

      let imageUrl = null;
      if (elem.data.hasOwnProperty('preview')) {
        if (elem.data.preview.images[0].variants.hasOwnProperty('gif')) {
          imageUrl = elem.data.thumbnail;
        } else {
          imageUrl = elem.data.preview.images[0].source.url;
        }
      } else {
        imageUrl = 'assets/no_image.svg';
      }
      cardHeader.style.backgroundImage = `url(${imageUrl})`;
      cardHeader.dataset.url = imageUrl;

      cardContentTitle.innerText = elem.data.title;
      cardContentTitle.className = 'content_title';

      cardContentList.className = 'content_infolist';

      cardContentAuthor.innerText = `by ${elem.data.author}`;
      cardContentAuthor.className = 'content_author';

      let date = new Date(elem.data.created_utc * 1000);
      cardContentDate.innerText = getTimeAgo(date);
      cardContentDate.className = 'content_date';

      cardContentScore.innerText = elem.data.score;
      cardContentScore.className = 'content_score';

      cardContentBodyRequestUrl = new URL(
        `${elem.data.permalink}.json`,
        urlBase
      );
      let cardContentBodyRequest = new XMLHttpRequest();
      cardContentBodyRequest.onload = function() {
        let bodyResponse = JSON.parse(this.response);
        cardContentBody.className = 'content_body';
        // console.log(bodyResponse[1].data.children[0].data);
        if (bodyResponse !== undefined) {
          if (bodyResponse[1].data != undefined) {
            if (bodyResponse[1].data.children[0] !== undefined) {
              cardContentBody.innerText =
                bodyResponse[1].data.children[0].data.body;
            } else {
              cardContentBody.innerText = 'NO TEXT';
            }
          }
        } else {
          cardContentBody.innerText = 'NO TEXT';
        }
      };
      cardContentBodyRequest.open('GET', cardContentBodyRequestUrl.href);
      cardContentBodyRequest.send();

      cardContent.appendChild(cardContentTitle);
      cardContentList.appendChild(cardContentAuthor);
      cardContentList.appendChild(cardContentDate);
      cardContentList.appendChild(cardContentScore);
      cardContent.appendChild(cardContentList);
      cardContent.appendChild(cardContentBody);

      card.appendChild(cardHeader);
      card.appendChild(cardContent);
      contentContainer.appendChild(card);
    });
    main.innerHTML = '';
    main.appendChild(contentHeader);
    main.appendChild(contentContainer);
  };
  request.open('GET', getJsonURL(subreddit, query, urlBase));
  request.send();
}

function getJsonURL(url, query, base) {
  let result = new URL(`${url}.json${query}`, base);
  return result.href;
}

function getTimeAgo(time) {
  if (time < 0) {
    return;
  }
  let timeSince = Date.now() - time;
  if (timeSince < 0) {
    console.log('larger than Date.now()');
    return;
  }
  for (let i = 0; i < timeFactors.length; i++) {
    if (timeSince < timeFactors[i].factor) {
      if (Math.round(timeSince) === 1) {
        return `${Math.round(timeSince)} ${timeFactors[i].unit} ago`;
      } else {
        return `${Math.round(timeSince)} ${timeFactors[i].unit}s ago`;
      }
    } else {
      timeSince /= timeFactors[i].factor;
    }
  }
}
