# Contributing

Contributions are always welcome! Fork the repository and submit a pull request.

## Development

All source is in `src/` — no bundler, no transpiler, plain JS served directly to the browser.

Load the extension unpacked from `src/` in Chrome/Edge (`chrome://extensions` → Load unpacked). For Firefox, run `./build.sh` and load the `.xpi` from `build/` via `about:debugging#/runtime/this-firefox`.

## Testing

Tests live in `test/` and use Jest + Puppeteer (headless Chromium with the extension loaded).

```bash
cd test && npm install   # First time only
cd test && npm test      # Run all tests
```

## Releasing

> For maintainers.

1. **Tag and push** (from an up-to-date `main`):

   ```bash
   git tag v1.0.X && git push origin v1.0.X
   ```

   The version is taken from the tag — no need to bump `src/manifest.json` manually (`build.sh` injects it).

2. **CI runs automatically** — watch it on the [Release workflow page](https://github.com/JetBrains/xdebug-extension/actions/workflows/release.yml). It runs the tests, builds the packages, creates a draft GitHub release with the `.zip` and `.xpi` attached, and uploads the `.zip` to the Chrome Web Store. The Chrome job is gated by the `Chrome` environment and may need approval in the Actions UI.

3. **Publish the draft GitHub release** on the [releases page](https://github.com/JetBrains/xdebug-extension/releases) — the workflow only creates a draft.

4. **Submit on the Chrome Web Store** — the CI upload does *not* auto-submit:
   - Open the extension in the [developer dashboard](https://chrome.google.com/webstore/devconsole).
   - Click **Submit for review** (top-right, visible on any tab) and confirm. Leave "deferred publishing" unchecked to auto-publish after review.
   - If the button is grayed out, check the **Privacy** tab for missing permission justifications or data-usage declarations.
   - Review takes from a few hours to a couple of days; the status flips to "Published" automatically.

5. **Firefox (manual)** — AMO submission is currently commented out in the workflow. Upload the `.xpi` from the GitHub release via the [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/addons).

6. **Edge (manual)** — upload the `.zip` from the GitHub release via [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview).
