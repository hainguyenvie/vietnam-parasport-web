# Running Vietnam ParaSports on Replit

Use the **Start application** workflow to run the full development stack:

- Next.js web client on port `5000` (the Replit preview)
- NestJS API on port `3001`
- Redis on port `6379`
- Replit's managed PostgreSQL database through the runtime-provided `DATABASE_URL`

The workflow maps the existing `SESSION_SECRET` to the API JWT and NextAuth
secrets at runtime. Do not add the secret value to tracked files.

## Database

The Prisma schema has been synced to the development database. If the schema
changes, run:

```bash
cd api-server && npx prisma db push --schema=prisma/schema.prisma
```

The database is intentionally not seeded during setup. Run
`npm run seed:all -w api-server` only when demo users and content are wanted.

## Optional integrations

Email delivery currently uses placeholder SMTP settings, so transactional emails
will not be delivered. Google OAuth is also unconfigured. Add real credentials
as Replit Secrets before enabling either feature.