/* ============================================
   DOM Utilities
   ============================================ */

/**
 * Create a DOM element with optional attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {Array|string} children - Child elements or text content
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.substring(2).toLowerCase();
      element.addEventListener(event, value);
    } else if (key === 'data' && typeof value === 'object') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });

  // Add children
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(child => {
    if (child != null) {
      if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    }
  });

  return element;
}

/**
 * Mount content to a container (replaces existing content)
 * @param {HTMLElement|string} container - Container element or selector
 * @param {HTMLElement|string} content - Content to mount
 */
export function mount(container, content) {
  const target = typeof container === 'string' ? qs(container) : container;
  if (!target) {
    console.error('[DOM] Mount target not found:', container);
    return;
  }

  if (typeof content === 'string') {
    target.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    target.innerHTML = '';
    target.appendChild(content);
  }
}

/**
 * Create HTML from string template
 * @param {string} htmlString - HTML string
 * @returns {HTMLElement}
 */
export function html(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  return template.content.firstElementChild;
}

/**
 * Query selector
 * @param {string} selector
 * @param {HTMLElement} context
 * @returns {HTMLElement|null}
 */
export function qs(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Query selector all
 * @param {string} selector
 * @param {HTMLElement} context
 * @returns {NodeList}
 */
export function qsa(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Add class to element
 */
export function addClass(element, className) {
  if (element) element.classList.add(className);
}

/**
 * Remove class from element
 */
export function removeClass(element, className) {
  if (element) element.classList.remove(className);
}

/**
 * Toggle class on element
 */
export function toggleClass(element, className) {
  if (element) element.classList.toggle(className);
}

/**
 * Set multiple attributes
 */
export function setAttrs(element, attrs) {
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

/**
 * Remove element from DOM
 */
export function remove(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Clear all children from element
 */
export function clear(element) {
  if (element) {
    element.innerHTML = '';
  }
}
