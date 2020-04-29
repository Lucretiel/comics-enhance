const raise = (thing) => {
  throw thing;
};

const search = (root, complexSelector) =>
  Array.isArray(complexSelector)
    ? complexSelector.reduce(search, document)
    : typeof complexSelector === "function"
    ? complexSelector(root)
    : typeof complexSelector === "string"
    ? root.querySelector(complexSelector)
    : raise(
        new Error(
          `Selector must be a array, function, or string; got ${complexSelector}`
        )
      );

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
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === button) {
      event.preventDefault();
    }
  });
};

const enhanceComic = ({ comic, next, prev }) => {
  console.log("Improving your comics experience");
  search(document, comic).scrollIntoView();
  createNavigator(next, "ArrowRight");
  createNavigator(prev, "ArrowLeft");
};
