# the-mdl_web

Web portals monorepo for The MDL platform.

## Structure

```
packages/
├── public/   → the-mdl.com (public-facing site)
└── admin/    → admin.the-mdl.com (admin portal)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build:public` | Build the public site |
| `npm run build:admin` | Build the admin portal |
| `npm run dev:public` | Run public site dev server |
| `npm run dev:admin` | Run admin portal dev server |

## Architecture

Each package is a standalone web application deployed to its own subdomain. The monorepo structure allows shared tooling and coordinated releases while keeping each portal independently deployable.

- **packages/public/** — Marketing site and public content at `the-mdl.com`
- **packages/admin/** — Admin portal at `admin.the-mdl.com`

Both portals communicate with the NestJS API at `api.the-mdl.com`.
