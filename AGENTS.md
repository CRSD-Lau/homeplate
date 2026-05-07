<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# HomePlate local mobile testing note

When testing HomePlate on a physical phone over the LAN, do not diagnose dead
mobile taps from `next dev` alone. `next dev --hostname 0.0.0.0` over a LAN IP
can render the app while client interactivity fails on mobile. First compare
against a production-mode LAN server:

```bash
pnpm build
pnpm exec next start --hostname 0.0.0.0 --port 3100
```

Then open `http://<windows-lan-ip>:3100` on the phone. If production mode works
but port 3000 dev mode does not, treat it as a Next dev/LAN-origin issue before
changing UI code. Consider `allowedDevOrigins` only when dev-mode LAN testing is
actually needed.

For auth/session issues on physical phones over the LAN, remember that
`next start` runs with `NODE_ENV=production` even when served over plain HTTP.
Do not set session cookies as `Secure` solely because `NODE_ENV` is production.
Cookie `secure` must follow the actual request protocol (`https` only). Safari
will drop or refuse `Secure` cookies on `http://<windows-lan-ip>:3100`, which
looks like the user is logged out on every redirect or page change.
