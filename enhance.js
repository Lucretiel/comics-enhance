/// Function that throws an exception
const raise = thing => {
	throw thing;
};

/// Search for an element in root using a complex selector. A complex selector
/// is:
///
/// - a string, in which case the element will be search with querySelector
/// - a function, in which case it will be called on root
/// - an array of complex selectors, which will be resolved in order
const search = (root, complexSelector) =>
	Array.isArray(complexSelector)
		? complexSelector.reduce(search, document)
		: typeof complexSelector === "function"
		? complexSelector(root)
		: typeof complexSelector === "string"
		? root.querySelector(complexSelector)
		: raise(
				new Error(
					`Selector must be a array, function, or string; got ${complexSelector}`,
				),
		  );

/// Search for an element in `document` with a complex selector. If the element
/// is found, call a function on it.
const useElement = (selector, func) => {
	if (!selector) return;

	const element = search(document, selector);
	if (!element) return;

	return func(element);
};

/// Given a selector and a button, search for an element matching the selector.
/// If that element exists and has an href attribute, create event listeners
/// on the given button that will navigate to that page when pressed. This
/// is used to create navigation shortcuts with the left and right arrow keys.
const createNavigator = (selector, button) =>
	useElement(selector, element => {
		const target = element.href;
		if (!target) return;

		console.log(`Creating navigator to '${target}'`);

		document.addEventListener("keyup", event => {
			if (event.key === button) {
				window.location.assign(target);
				event.preventDefault();
			}
		});

		document.addEventListener("keydown", event => {
			if (event.key === button) {
				event.preventDefault();
			}
		});
	});

const addAltText = (textSelector, afterSelector) =>
	useElement(textSelector, textNode =>
		useElement(afterSelector, afterNode => {
			const altText = textNode.title;

			const element = document.createElement("span");
			element.innerText = altText;
			element.style.fontSize = "16pt";
			element.style.backgroundColor = "#FFFFFF";

			afterNode.appendChild(element);
		}),
	);

/// Entry point for comic enhancing. comic, next, and prev are all complex
/// selectors used to create an enhanced comic experience. Each selector
/// is used to find an element with the search function, then:
///
/// - The `comic` element is scrolled to
/// - A right-arrow shortcut is created to the href of next
/// - A left-arrow shortcut is created to the href of prev
/// - If alt is not nil, its text and after selectors are consulted to insert
///   alt text
const enhanceComic = ({ comic, next, prev, alt }) => {
	console.log("Improving your comics experience");
	useElement(comic, element => element.scrollIntoView());
	createNavigator(next, "ArrowRight");
	createNavigator(prev, "ArrowLeft");
	if (alt) {
		const { text, after } = alt;
		addAltText(text, after);
	}
};
