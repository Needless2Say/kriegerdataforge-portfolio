# Google Analytics self exclusion

The site runs Google Analytics 4 under measurement ID `G-50SJBQ5MV2`. A flag in the
browser's `localStorage` switches it off for that browser, so the owner's own visits stay
out of the numbers. It is the same switch the personal portfolio uses, under the same key.

---

## Opt yourself out

Open the live site, <https://needless2say.github.io/kriegerdataforge-portfolio>, open
DevTools, go to the **Console** tab, and run

```js
localStorage.setItem('ga-opt-out', '1')
```

Reload the page. Google's script still downloads, but the page never configures it and it
records nothing from that browser.

## Turn tracking back on

```js
localStorage.removeItem('ga-opt-out')
```

Reload the page and analytics resumes.

---

## One switch covers both sites

`localStorage` belongs to an origin, the scheme and host, not to a path. This site and the
personal portfolio are both served from `https://needless2say.github.io`, so they share one
`localStorage`, and both read the same `ga-opt-out` key. Setting it on either site opts that
browser out of both, and removing it opts back in to both. A browser that is already opted
out on the personal portfolio is already opted out here.

Keep the key the same in both repos. Renaming it in one of them quietly splits the switch in two.

## Notes

- The flag survives closing the browser and restarting the machine. Set it once per browser profile.
- Every browser, and every profile within one, keeps its own `localStorage`. Set the flag in each one you visit the sites from.
- Private and incognito windows start with an empty `localStorage` and clear it when they close, so analytics runs there unless you set the flag in that window.
- A local preview on `localhost` is a different origin with its own storage, and each port counts as its own origin. The flag set on the live site does not reach it, so set it there too if you preview often.

## How it works

The Google Analytics snippet in `src/app/layout.tsx` checks the flag before it does anything
else. When the flag is set, the snippet sets `window['ga-disable-G-50SJBQ5MV2']`, the switch
Google's tag reads, and never calls `gtag('config')`, so nothing is recorded. When it is not
set, the snippet configures analytics as normal.
