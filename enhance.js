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
const queryChildren = selector => select(node => node.querySelector(selector));

/// Same as queryChildren, but also instead operate the input node if it matches
const query = selector =>
	select(node =>
		node.matches?.(selector) ? node : node.querySelector(selector),
	);

/// Search a node with `querySelectorAll`
const queryAll = selector => selectAll(node => node.querySelectorAll(selector));

const auto = builder => selector =>
	typeof selector == "string"
		? builder(selector)
		: selector == null
		? operation => node => {}
		: selector;

const autoQuery = auto(queryChildren);
const autoQueryAll = auto(queryAll);

/// Primitives and combinators

/// Create a selector out of a function that returns a subnode (or null) from
/// a node
const select = nodeSelector => operation => node => {
	const selected = nodeSelector(node);
	if (selected) return operation(selected);
	else throw new Error(`Failed to match ${nodeSelector} in ${node}`);
};

/// Create a selector out of a function that returns 0 or more subnodes from
/// a node
const selectAll = nodeSelectorAll => operation => node =>
	Array.from(nodeSelectorAll(node)).forEach(node => operation(node));

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

/// Comic Enhancers

/// Given a selector and a button, create an operation that searches for an
/// element matching the selector. If that element exists and has an href
/// attribute, create event listeners on the given button that will navigate
/// to that page when pressed. This is used to create navigation shortcuts with
/// the left and right arrow keys.
const createNavigator = (selector, button) =>
	withBase(selector)(element => root => {
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

const isLink = text =>
	/^https?:\/\/(?:[-\w]+\.)+[-\w+]+(?:\/[-\w_~%]+)*\/?(?:\?[-\w_~%]+=[-\w_~%]+(?:&[-\w_~%]+=[-\w_~%]+)*)?(#[-\w_~%]+)?$/.test(
		text,
	);

const addAltText = (textSelector, afterSelector, foreground, background) =>
	withBase(textSelector)(textNode => {
		const altText = textNode.title;

		return afterSelector(afterNode => {
			console.log("Adding alt text", textNode, afterNode);
			let element = document.createElement("span");

			element.innerText = altText;
			element.style.fontSize = "16pt";

			if (foreground) element.style.color = foreground;
			if (background) element.style.backgroundColor = background;

			if (isLink(altText)) {
				const link = document.createElement("a");
				link.href = altText;
				link.appendChild(element);
				element = link;
			}

			afterNode.parentNode.insertBefore(element, afterNode.nextSibling);
		});
	});

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
		withBase(queryImg)(img => content => {
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
		// Create arrow key navigation
		createNavigator(autoQuery(next), "ArrowRight"),
		createNavigator(autoQuery(prev), "ArrowLeft"),

		// Remove noise
		autoQueryAll(noise)(element => element.remove()),

		// Add alt text
		alt
			? addAltText(
					autoQuery(alt.text),
					autoQuery(alt.after),
					alt.foreground,
					alt.background,
			  )
			: () => {},

		// Scroll the comic into view after the first img it contains has
		// loaded
		scrollAfterLoad(autoQuery(comic)),
	])(document);
};
