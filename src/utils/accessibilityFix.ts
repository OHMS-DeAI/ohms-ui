// Fix for aria-hidden accessibility issue with IdentityKit
export const fixAriaHiddenIssue = () => {
  // Monitor for aria-hidden being set on root element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
        const root = document.getElementById('root');
        if (root && root.getAttribute('aria-hidden') === 'true') {
          // Check if any focusable elements are focused
          const focusedElement = document.activeElement;
          if (focusedElement && root.contains(focusedElement)) {
            // Remove aria-hidden if a focusable element is focused
            root.removeAttribute('aria-hidden');
          }
        }
      }
    });
  });

  // Start observing the root element
  const root = document.getElementById('root');
  if (root) {
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['aria-hidden']
    });
  }

  // Also listen for focus events
  document.addEventListener('focusin', (event) => {
    const root = document.getElementById('root');
    if (root && root.getAttribute('aria-hidden') === 'true') {
      if (root.contains(event.target as Node)) {
        root.removeAttribute('aria-hidden');
      }
    }
  });

  return () => {
    observer.disconnect();
  };
};
