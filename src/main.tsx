import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent scrollbar from disappearing when dialogs/sheets open
// This prevents Radix UI from setting overflow: hidden on the body
const preventScrollbarDisappearance = () => {
  // Intercept setProperty to prevent overflow: hidden
  const originalBodySetProperty = document.body.style.setProperty.bind(document.body.style);
  const originalHtmlSetProperty = document.documentElement.style.setProperty.bind(document.documentElement.style);
  
  document.body.style.setProperty = function(property: string, value: string, priority?: string) {
    if (property === 'overflow' && value === 'hidden') {
      return; // Don't apply overflow: hidden
    }
    return originalBodySetProperty(property, value, priority);
  };
  
  document.documentElement.style.setProperty = function(property: string, value: string, priority?: string) {
    if (property === 'overflow' && value === 'hidden') {
      return; // Don't apply overflow: hidden
    }
    return originalHtmlSetProperty(property, value, priority);
  };

  // Intercept direct overflow property assignments (e.g., element.style.overflow = 'hidden')
  const interceptOverflowProperty = (element: HTMLElement) => {
    const styleDescriptor = Object.getOwnPropertyDescriptor(element.style, 'overflow');
    if (styleDescriptor) {
      Object.defineProperty(element.style, 'overflow', {
        set: function(value: string) {
          if (value !== 'hidden') {
            styleDescriptor.set?.call(this, value);
          }
        },
        get: styleDescriptor.get,
        configurable: true,
        enumerable: styleDescriptor.enumerable
      });
    }
  };

  interceptOverflowProperty(document.body);
  interceptOverflowProperty(document.documentElement);

  // Also use MutationObserver as a fallback to immediately revert overflow: hidden
  const observer = new MutationObserver(() => {
    const bodyStyle = window.getComputedStyle(document.body);
    const htmlStyle = window.getComputedStyle(document.documentElement);
    
    // If overflow is set to hidden, change it to auto to keep scrollbar visible
    if (bodyStyle.overflow === 'hidden' && document.body.style.overflow !== 'auto') {
      document.body.style.overflow = 'auto';
    }
    if (htmlStyle.overflow === 'hidden' && document.documentElement.style.overflow !== 'auto') {
      document.documentElement.style.overflow = 'auto';
    }
  });

  // Start observing body and html for style attribute changes
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: false,
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: false,
  });
};

// Run the fix once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', preventScrollbarDisappearance);
} else {
  preventScrollbarDisappearance();
}

//gabe wuz here
createRoot(document.getElementById("root")!).render(<App />);
