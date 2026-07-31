/**
 * Robust external-link opener.
 *
 * Works in three progressively-degrading steps so it never dead-ends,
 * whether the app runs standalone, inside a sandboxed preview iframe,
 * or in a browser with popups blocked:
 *
 *  1. window.open() in a new tab (detectable: returns null when blocked)
 *  2. a synthetic <a target="_blank"> click (allowed by some sandboxes
 *     where window.open is not)
 *  3. a top-level navigation (breaks out of the iframe), falling back to
 *     same-frame navigation if the parent is cross-origin and locked down.
 */

export function normalizeUrl(raw: string): string {
  const url = (raw || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/\//.test(url)) return `https:${url}`;
  return `https://${url.replace(/^\/+/, "")}`;
}

function topLevelNavigate(url: string) {
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // cross-origin parent: fall through
  }
  window.location.href = url;
}

function anchorClick(url: string): boolean {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens `rawUrl` externally. Returns nothing; always makes a best effort.
 * Must be called synchronously from a user gesture (click/tap) so browsers
 * treat the popup as user-initiated.
 */
export function openExternal(rawUrl: string) {
  const url = normalizeUrl(rawUrl);
  if (!url) return;

  // 1. Standard popup — detectable failure.
  let win: Window | null = null;
  try {
    win = window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    win = null;
  }

  if (win && !win.closed) {
    try {
      win.opener = null;
    } catch {
      // ignore (cross-origin)
    }
    win.focus?.();
    return;
  }

  // 2. Synthetic anchor click (undetectable success, so verify below).
  const clicked = anchorClick(url);

  if (!clicked) {
    topLevelNavigate(url);
    return;
  }

  // 3. If nothing actually opened, the page keeps focus and stays visible —
  //    then break out of the iframe with a top-level navigation.
  window.setTimeout(() => {
    const stillHere =
      document.visibilityState === "visible" &&
      (typeof document.hasFocus === "function" ? document.hasFocus() : true);
    if (stillHere) topLevelNavigate(url);
  }, 600);
}
