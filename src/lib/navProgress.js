const listeners = new Set();
let pending = false;

function emit() {
  listeners.forEach((fn) => fn(pending));
}

export function startNav() {
  pending = true;
  emit();
}

export function doneNav() {
  if (!pending) return;
  pending = false;
  emit();
}

export function subscribeNav(fn) {
  listeners.add(fn);
  fn(pending);
  return () => listeners.delete(fn);
}
