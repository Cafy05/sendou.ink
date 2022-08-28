Note: This is the WIP Splatoon 3 version of the site. To see the current live version checkout the [main branch](https://github.com/Sendouc/sendou.ink/tree/main)

## Running locally

### sendou.ink

Prerequisites: [nvm](https://github.com/nvm-sh/nvm)

There is a sequence of commands you need to run:

1. `nvm use` to switch to the correct Node version. If you have problems with nvm you can also install the latest LTS version of Node.js from [their website](https://nodejs.org/en/).
2. `npm i` to install the dependencies.
3. Make a copy of `.env.example` that's called `.env`. See below for note about environment variables.
4. `npm run migrate up` to set up the database tables.
5. `npm run seed` to fill database with test data.
6. `npm run dev` to run the project in development mode.

And if you want to run the E2E tests:

6. Make a copy of the `db.sqlite3` file created by migration and name it `db-cypress.sqlite3`.
7. `npm run dev:cypress` and `npm run cy:open` can be used to run the E2E tests.

#### Environment variables

You don't need to fill the missing values from `.env.example` to get started. Instead of using real auth via Discord you can "impersonate" the admin (=Sendou#0043) or any other use in the /admin page once the project has started up. `LOHI_TOKEN` is only needed for bot + sendou.ink interoperability.

## Lohi

TODO: instructions on how to develop Lohi locally

## Contributing

Contributions very welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## API

If you want to use the API then please leave an issue explaing your use case. By default I want to allow open use of the data on the site. It's just not recommended to use the same API's the web pages use as they are not stable at all and can change at any time without warning.

## Project structure

```
sendou.ink/
├── app/
│   ├── components/ -- React components
│   ├── db/ -- Database layer
│   ├── hooks/ -- React hooks
│   ├── modules/ -- "nodu_modules but part of the app" https://twitter.com/ryanflorence/status/1535103735952658432
│   ├── routes/ -- Routes see: https://remix.run/docs/en/v1/guides/routing
│   ├── styles/ -- All .css files of the project for styling
│   ├── utils/ -- Random helper functions used in many places
│   └── permissions.ts / -- What actions are allowed. Separated by frontend and backend as frontend has constraints based on what user sees.
├── cypress/ -- see: https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Folder-structure
├── discord-bot/ -- Lohi Discord bot that works together with sendou.ink
├── migrations/ -- Database migrations
├── public/ -- Images, built assets etc. static files to be served as is
└── scripts/ -- Stand-alone scripts to be run outside of the app
```

## Commands

### Converting gifs (badges) to thumbnail (.png)

```bash
sips -s format png ./sundae.gif --out .
```

### Add new badge to the database

```bash
npm run add-badge -- sundae "4v4 Sundaes"
```

### Convert many .png files to .avif

While in the folder with the images:

```bash
for i in *; do npx @squoosh/cli --avif '{"cqLevel":33,"cqAlphaLevel":-1,"denoiseLevel":0,"tileColsLog2":0,"tileRowsLog2":0,"speed":6,"subsample":1,"chromaDeltaQ":false,"sharpness":0,"tune":0}' $i; done
```

## How to...

### Download production database from Render.com

Note: This is only useful if you have access to a production running on Render.com

1. Access "Shell" tab
2. `cd /var/data`
3. `sqlite3 db.sqlite3` then inside sqlite3 CLI `.output dump`, `.dump` & `.quit`
4. `wormhole send dump`
5. On the receiver computer use the command shown.
6. `sqlite3 db-prod.sqlite3 < dump` on the receiver computer.

### Add a new weapon

1. Add image in both .png and .avif with the correct weapon ID (`replace-img-names.ts` can help)
2. Create new weapon ids json and weapon translation jsons using `create-weapon-json.ts` script
