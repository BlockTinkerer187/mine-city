/* globals markdownit */

const DEFAULT_PAGE="Welcome";
const PINNED_PAGES = [DEFAULT_PAGE];

var md = new markdownit({
  html: true,
});

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
const debounce = function(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const scrubTitle = (title) => title.replace(/[^\w]/g, '-'); //letters and numbers only

const hit = (title) => {
  console.log("found matching doc:", title);

  //highlight the nav item:
  $(`#${scrubTitle(title)}-list`).addClass('highlight');
};

const search = function (query) {
  //remove preexisting highlights:
  $('#list-tab .highlight').removeClass('highlight');
  $("#search-stats").text("Searching...");
  $('#nav-tabContent').unhighlight();

  query = query.trim();
  if(!query) {
    $("#search-stats").text('');
    return;
  }

  const lowerQuery = query.toLowerCase();
  
  let hitCount = 0;
  //search the index and highlight the results in the NAV and the content.
  window.cache.forEach((item) => {
    const {title, body} = item;
    if(title.toLowerCase().includes(lowerQuery) || body.includes(lowerQuery)) {
      hitCount++;
      hit(title);
    }
  });
  
  let resultText = `${hitCount}`;
  if(hitCount === 0) {
    resultText = "🤷";
  } else if(hitCount > 9000) {
     resultText = "There are over NINE THOUSAND.";
  }
    
  $("#search-stats").text(resultText);
  $('#nav-tabContent').highlight(lowerQuery);
}

const init = () => {
  var data = [];
  
  $.getJSON("/rules/md", (pages) => {
    Object.keys(pages).forEach((key) => {
      data.push({
        title: key,
        body: pages[key]
      })
    });
    
    createOutline(data, PINNED_PAGES);
    indexData(data);
  });
}

function createOutline(data, pinnedPages) {
  // data: {title, body}
  let scrubbed = data.map((item) => {
    item.scrubbed = scrubTitle(item.title);
    return item;
  });
  
  const render = ({title, body, scrubbed, extraClass=""}) => {
    const rendered = md.render(body);
    $(`<a class="list-group-item list-group-item-action ${extraClass}" id="${scrubbed}-list" data-toggle="list" data-title="${title}" href="#${scrubbed}" role="tab" aria-controls="${scrubbed}">${title}</a>`).appendTo('#list-tab');
    $(`<div class="tab-pane fade" id="${scrubbed}" role="tabpanel" aria-labelledby="${scrubbed}-list">${rendered}</div>`).appendTo('#nav-tabContent');
  }
  
  let pinned = scrubbed.filter(
    ({scrubbed}) => pinnedPages.includes(scrubbed)
  );
  pinned.forEach(page => page.extraClass="pinned");
  let pages = scrubbed.filter(({scrubbed}) => !pinnedPages.includes(scrubbed));
  
  pinned.forEach(render);
  pages.forEach(render);
  
  // start the right page visible
  const hash = window.location.hash || "#" + DEFAULT_PAGE;
  $(`${hash}, ${hash}-list`).addClass('active show');
}

// index some data
const indexData = function (data) {
  window.cache = data.map(({title, body}) => ({
    title, body: body.toLowerCase(),
  }));
}

// initialize data
init();

// PAGE CONTROLLERS

$(window).on('hashchange', event => {
  const hash = window.location.hash || "#" + DEFAULT_PAGE;
  $(`${hash}-list`).click();
});
$(document).on('click', '#list-tab a', evt => window.location.assign(evt.target.href));

// do a search
$('.js-search-form').on('input', debounce(() => {
  console.log("Searching");
  search(document.getElementById("s").value);
}, 100)).submit(evt => evt.preventDefault());