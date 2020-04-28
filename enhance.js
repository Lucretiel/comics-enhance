const search = (root, complexSelector) =>
  Array.isArray(complexSelector)
    ? complexSelector.reduce(search, document)
    : typeof complexSelector === "function"
    ? complexSelector(root)
    : root.querySelector(complexSelector);

const createNavigator = (selector, button) => {
  if (!selector) return;
  console.log(`Checking navigator via '${selector}' for '${button}'`);

  const element = search(document, selector);
  if (!element) return;

  const target = element.href;
  if (!target) return;

  console.log(`Creating navigator to '${target}'`);
  document.addEventListener("keyup", (event) => {
    if (event.key === button) {
      window.location.assign(target);
    }
  });
};

const createNextNav = (selector) => createNavigator(selector, "ArrowRight");
const createPrevNav = (selector) => createNavigator(selector, "ArrowLeft");

const enhanceComic = ({ comic, next, prev }) => {
  console.log("Improving your comics experience");
  search(document, comic).scrollIntoView();
  createNextNav(next);
  createPrevNav(prev);
};
