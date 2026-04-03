// Polyfill window.matchMedia for antd components in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill getComputedStyle for antd (suppress jsdom not-implemented errors)
const { getComputedStyle: origGCS } = window;
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  try {
    return origGCS.call(window, elt, pseudoElt ?? undefined);
  } catch {
    return {
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration;
  }
};
