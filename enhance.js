/// SELECTOR COMBINATORS
///
/// An operation is a function that takes a node as an argument and does some
/// kind of work with it: (node: Element) => void
///
/// A selector is a function that takes an operation as an argument and returns
/// a new operation that selects 0 or more subnodes from the input node and
/// performs the operation on them: (Operation) => Operation

/// Base selectors

/// Search a node with `querySelector`
const queryChildren = selector => operation => node => {
	const selected = node.querySelector(selector);
	if (selected) operation(selected);
};

/// Same as queryChildren, but also instead operate the input node if it matches
const query = selector => {
	const childSelector = queryChildren(selector);
	return operation => {
		const childOperation = childSelector(operation);
		return node =>
			(node?.matches?.(selector) ? operation : childOperation)(node);
	};
};

/// Search a node with `querySelectorAll`
const queryAll = selector => func => node =>
	node.querySelectorAll(selector).forEach(selected => func(selected));

const auto = builder => selector =>
	typeof selector == "string"
		? builder(selector)
		: selector == null
		? operation => node => {}
		: selector;

const autoQuery = auto(queryChildren);
const autoQueryAll = auto(queryAll);

/// Primitives and combinators

/// Create a selector that concatenates the results of all the given selectors
const concat = selectors => operation =>
	all(selectors.map(selector => selector(operation)));

/// Create an operation that executes each input operation on the input node
const all = operations => node => operations.forEach(op => op(node));

/// Given a selector, create a new selector that retains the original input
/// element. The operation should return another operation that accepts the
/// original input node
const withBase = selector => operation => node =>
	selector(selected => operation(selected)(node))(node);

/// Given a sequence of selectors, create a selector that runs each one on
/// the output of the previous one
const chain = selectors => operation =>
	selectors.reduceRight((op, selector) => selector(op), operation);

/// Wrap a selector such that, if it doesn't execute the operation at all,
/// the operation is called once with null
const force = selector => operation => node => {
	let success = false;

	selector(selected => {
		success = true;
		operation(selected);
	});

	if (!success) {
		operation(null);
	}
};

/// Wrap a selector such that it only executes the operation on the first
/// selected node
const once = selector => operation => node => {
	let done = false;

	selector(selected => {
		if (!done) {
			done = true;
			operation(selected);
		}
	})(node);
};

/// Comic Enhancers

/// Given a selector and a button, create an operation that searches for an
/// element matching the selector. If that element exists and has an href
/// attribute, create event listeners on the given button that will navigate
/// to that page when pressed. This is used to create navigation shortcuts with
/// the left and right arrow keys.
const createNavigator = (selector, button) =>
	withBase(once(selector))(element => root => {
		const target = element.href;
		if (!target) return;

		console.log(`Creating navigator to '${target}'`);

		root.addEventListener("keyup", event => {
			if (event.key === button) {
				window.location.assign(target);
				event.preventDefault();
			}
		});

		root.addEventListener("keydown", event => {
			if (event.key === button) {
				event.preventDefault();
			}
		});
	});

const addAltText = (textSelector, afterSelector) =>
	withBase(textSelector)(textNode =>
		afterSelector(afterNode => {
			console.log("Adding alt text", textNode, afterNode);
			const element = document.createElement("span");

			element.innerText = textNode.title;
			element.style.fontSize = "16pt";
			element.style.backgroundColor = "#FFFFFF";
			element.style.color = "#000000";

			afterNode.appendChild(element);
		}),
	);

const queryImg = query("img");

/// Create a future that resolves when the given node is loaded
const loaded = node =>
	new Promise((resolve, reject) => {
		if (node.complete) {
			resolve();
		} else {
			node.addEventListener("load", () => resolve(), { once: true });
			node.addEventListener("error", event => reject(event), { once: true });
		}
	});

/// Scroll the element of the contentSelector into view after its first
/// image child is loaded
const scrollAfterLoad = contentSelector =>
	contentSelector(
		withBase(force(once(queryImg)))(img => content => {
			if (img == null) {
				console.log("scrolling into view", content);
				content.scrollIntoView();
			} else {
				console.log("waiting for image to load", img);
				loaded(img).finally(() => {
					console.log("scrolling into view", content);
					content.scrollIntoView();
				});
			}
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
/// - All elements matching the noise selector are removed
///
/// A query is a function with the signature
///
/// (operation: (selected: node) => void) => (root: node) => void
///
/// It should search the root for any nodes it wants to select and call the
/// operation on each one. We already provide `query`, `queryChildren`, and
/// `queryAll`, which correspond roughly to `node.querySelector` and
/// `node.querySelectorAll`.
///
/// You can also simply provide strings, which will be converted into
/// querySelector queries.
///
/// Example:
///
/// enhanceComic({
/// 	comic: ".main-content",
/// 	next: "nav .next-arrow",
/// 	prev: "nav .prev-arrow",
/// 	alt: {
/// 		text: ".main-content img",
/// 		after: ".main-content",
/// 	}
/// 	noise: "nav",
/// })
const enhanceComic = ({ comic, next, prev, alt, noise }) => {
	console.log("Improving your comics experience");

	all([
		// Scroll the comic into view after the first img it contains has
		// loaded
		scrollAfterLoad(autoQuery(comic)),

		// Create arrow key navigation
		createNavigator(autoQuery(next), "ArrowRight"),
		createNavigator(autoQuery(prev), "ArrowLeft"),

		// Remove noise
		autoQueryAll(noise)(element => element.remove()),

		// Add alt text
		alt ? addAltText(autoQuery(alt.text), autoQueryAll(alt.after)) : () => {},
	])(document);
};
