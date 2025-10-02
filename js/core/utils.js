import { DEFAULT_DEBOUNCE_DELAY } from "../constants.js";

export function getComputedStyles(customProperty) {
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);
    return computedStyles.getPropertyValue(customProperty);
}

export function setCustomProperties(styles) {
  if (Object.prototype.toString.call(styles) === '[object Object]') {
    const root = document.documentElement;
    for (const [property, value] of Object.entries(styles)) {
        root.style.setProperty(property, value);
    }
  }
}

export function debounce(func, delay = DEFAULT_DEBOUNCE_DELAY) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => func.apply(this, args), delay);
  };
}


export function createEl(tagName, props = {}) {
  if(!tagName) return null;
  const el = document.createElement(tagName);
  for (const [key, value] of Object.entries(props)) {
    if(key.startsWith("data-") || key.startsWith("aria-") || el.hasAttribute(key)) {
      // gestion des attributs data-*
      el.setAttribute(key, value);
    }
    if (key in el) {
      // c'est bien une propriété du DOM
      el[key] = value;
    } else {
      console.warn(`Propriété inconnue: ${key}`);
    }
  }
  return el;
}

//// ==== EN COURS DE DEV. 24/09/2025 ====///
export async function dynamicImportModule(moduleName, modulePath) {
  /* return import(modulePath)
    .then(module => {
      console.log(`Module ${moduleName} loaded successfully`);
      return module;
    })
    .catch(error => {
      console.error(`Error loading module ${moduleName}:`, error);
      throw error;
    }); */
    try {
      if(!moduleName) {
        const module = await import(modulePath);
        console.log(`Module ${moduleName} loaded successfully`);
        return module;
        // ou 
        // return await import(modulePath);
      }
    } catch (error) {
      console.error(`Error loading module ${moduleName}:`, error);
      throw error;
    }
}


// querySelector
// querySelectorAll
// removeEventListener
// addEventListener


//// TEST /////
/* export function reactive(obj) {
  const listeners = new Map();

  return new Proxy(obj, {
    get(target, prop) {
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      if (listeners.has(prop)) {
        listeners.get(prop).forEach(fn => fn(value));
      }
      return true;
    },
    watch(prop, callback) {
      if (!listeners.has(prop)) {
        listeners.set(prop, []);
      }
      listeners.get(prop).push(callback);
    }
  });
} */
export function reactive(obj) {
  const listeners = new Map();

  const proxy = new Proxy(obj, {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      if (listeners.has(prop)) {
        listeners.get(prop).forEach(fn => fn(value));
      }
      return result;
    }
  });

  // on expose la méthode watch sur le proxy
  Object.defineProperty(proxy, 'watch', {
    value(prop, callback) {
      if (!listeners.has(prop)) listeners.set(prop, []);
      listeners.get(prop).push(callback);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  return proxy;
}
