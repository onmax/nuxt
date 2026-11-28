# Glossary

<!-- Format and checks: https://glosslint.onmax.me/guide/glossary -->

The terms the Nuxt docs (`docs/`), the config schema JSDoc (`packages/schema`) and runtime diagnostics use. A proposal: each term lists the variants found in the docs today.

Drafted by an AI agent (Claude Code); not yet reviewed by a human.

## Server route
What: A handler in `server/api/` or `server/routes/`, or one a module adds with `addServerHandler`, that answers HTTP requests at a path.
How: An API route is a server route under `/api`; "API endpoint" stays for an external API that `$fetch` calls; say "API route" only when the `/api` prefix matters. Server middleware runs before every server route and is not one. The function a server route or server middleware exports is its handler.
Avoid:
- server endpoint: Same thing; the directory page calls it a server route.
- server API route: Use "server route", or "API route".
- API handler: The handler is the function; the route is the file and its path.
Good:
- Throw `createError` from a server route
Bad:
- Throw `createError` from a server endpoint
Links:
- [server/ directory](https://nuxt.com/docs/directory-structure/server#server-routes)
Translations:
- fr: route serveur
- de: Server-Route
Forms:
- fr: `/routes? (?:de |du )?serveur/`
- de: Server-Routen, Serverroute, Serverrouten

## Server handler
What: A function registered with `defineHandler()` in `server/` or with `addServerHandler()`, which Nuxt runs as a server route or as server middleware.
How: Use it when the text covers both routes and middleware, as Kit's `addServerHandler` does. For a handler at a path, say server route.
Links:
- [Nuxt Kit: Nitro](https://nuxt.com/docs/api/kit/nitro#addserverhandler)

## NuxtApp
What: The per-request runtime app that `useNuxtApp()` returns, holding the Vue app, the payload, hooks and provided helpers.
How: Not the build-time Nuxt instance that modules receive. In prose, "the Nuxt app".
Links:
- [NuxtApp](https://nuxt.com/docs/guide/going-further/nuxt-app)
Case: exact

## Nuxt context
What: Where a composable can reach the current NuxtApp: a plugin, a Nuxt hook, route middleware, or a Vue `setup()` function.
How: Runtime only. For the build-time object, say "the Nuxt instance" (`useNuxt()`); for where Kit can call `useNuxt()`, say "inside a module or a Nuxt hook". For typed templates, say "the app types".
Links:
- [The Nuxt context](https://nuxt.com/docs/guide/going-further/nuxt-app#the-nuxt-context)

## Nuxt instance
What: The build-time `Nuxt` object that `loadNuxt()` creates and `useNuxt()` returns, holding the resolved options, hooks and the module graph.
How: Build time only, in modules and Kit. A composable that runs in the app needs the NuxtApp, not this object.
Links:
- [Nuxt Kit: context](https://nuxt.com/docs/api/kit/context)

## App builder
What: The package that bundles the Vue app: the browser bundle and, with SSR, the server entry. Vite (default), webpack, Rspack and Rsbuild, selected with the `builder` option.
How: "Bundler" is the tool inside it (Vite, Rolldown, webpack). Plain "builder" means the app builder only where the `builder` option is the topic.
Links:
- [Creating an App Builder or Server Builder](https://nuxt.com/docs/guide/going-further/builders)

## Server builder
What: The package that turns the app build into a deployable server. `@nuxt/nitro-server` (Nitro) is the default; `@nuxt/vite-server` is experimental. Selected with `server.builder`.
How: Nitro is one server builder, not "the server engine" of every Nuxt app. Say "Nitro" when the feature only exists on Nitro.
Avoid:
- server engine: Since server builders, Nitro is the default server builder, not the only one.
Links:
- [Creating an App Builder or Server Builder](https://nuxt.com/docs/guide/going-further/builders)

## Route middleware
What: A function that runs before navigation to a route in the Vue app: inline in `definePageMeta`, named in `app/middleware/`, or global with a `.global` suffix.
How: Not server middleware, which runs on the server before server routes.
Avoid:
- Nuxt middleware: The directory page and `defineNuxtRouteMiddleware` call it route middleware.
Good:
- Call it in a plugin or route middleware
Bad:
- Call it in a plugin or Nuxt middleware
Links:
- [middleware/ directory](https://nuxt.com/docs/directory-structure/app/middleware)

## Prerender
What: Render a route to HTML at build time, with `nuxt generate`, `routeRules` or `prerenderRoutes()`.
How: One word, as the API and config write it.
Avoid:
- pre-rendered: One word, as the API and config write it.
- pre-rendering: One word, as the API and config write it.
Good:
- Selective prerendering
Bad:
- Selective pre-rendering
Links:
- [Prerendering](https://nuxt.com/docs/getting-started/prerendering)
Translations:
- de: Vorab-Rendering
Forms:
- en: prerendering
- de: Prerendering, `/vorgerendert\p{L}*/`, `/vorab gerendert\p{L}*/`, vorab zu rendern

## Auto-import
What: A Nuxt feature that makes components, composables, utilities and Vue APIs available without an `import` statement.
How: Hyphenated as noun and verb: "auto-imports", "auto-imported". The config key is `imports`.
Avoid:
- auto imported: Hyphenated, as in "auto-imported".
- automatically imported: Use "auto-imported".
Good:
- Use auto-imported composables
Bad:
- Use auto imported composables
Links:
- [Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports)
Translations:
- fr: import automatique
- de: automatischer Import
Forms:
- fr: `/import\p{L}* automatique/`, automatiquement import, `/import\p{L}* automatiquement/`
- de: `/automatisch\p{L}* Import\p{L}*/`, `/automatisch importier\p{L}*/`, Auto-Import, Auto-Imports

## Layer
What: A Nuxt project, local or from a package, that an app extends with `extends` to share its config, components, pages and server code.
Links:
- [Layers](https://nuxt.com/docs/getting-started/layers)
Translations:
- fr: keep (couche)
- de: keep
Hints:
- fr: the Nuxt layers feature (extends)
- de: the Nuxt layers feature (extends); der Layer, die Layer (nicht "Schicht" oder "Ebene")

## Payload
What: The data the server render sends to the browser with the HTML, such as `useAsyncData` results and `useState` values, which the client reads instead of fetching again.
Translations:
- fr: keep (charge utile)
- de: keep
Hints:
- fr: serialised server state sent to the client
- de: serialised server state sent to the client (Nuxt Payload); die Payload

## Hydration
What: The step in the browser where Vue takes over the server-rendered HTML, attaches event listeners and makes the page interactive.
Translations:
- fr: hydratation
- de: keep
Forms:
- fr: hydrat
Hints:
- de: In Nuxt-/Vue-Dokumentation „Hydration“ und „hydratisieren“ verwenden; nicht „Hydrierung“ oder „hydrieren“.

## Directory
What: A folder of the project, such as `app/pages/` or `server/`, whose files Nuxt reads by convention.
Translations:
- fr: répertoire
- de: Verzeichnis
Forms:
- fr: répertoire, dossier
- de: Verzeichnisse, Verzeichnissen, Verzeichnisses
Hints:
- de: streng "Verzeichnis", nicht "Ordner"

## Bundle
What: A JavaScript file the bundler writes from the app's modules, for the browser or for the server.
Translations:
- fr: keep
- de: keep
Hints:
- de: Nomen beibehalten (das Bundle, der Bundler, das Bundling); als Verb „bündeln“ / „gebündelt“ verwenden.

## Template
What: The markup in a Vue component's `<template>` block, or a file a module generates into the build directory with `addTemplate()`.
Translations:
- fr: keep
- de: Vorlage
Forms:
- de: Vorlagen, Template, Templates
Hints:
- de: Im Kontext von Projektvorlagen „Vorlage“; bei Vue- bzw. HTML-<template>-Tags bleibt das Code-Tag selbst unübersetzt.

## Helper
What: A small function that Nuxt, Kit or a module exports to wrap a common task, such as `defineNuxtConfig()` or `createResolver()`.
Translations:
- fr: keep
- de: Hilfsprogramm
Forms:
- de: Hilfsprogramme, Hilfsprogramm
Hints:
- de: Für ein eigenständiges Hilfswerkzeug; wenn ausdrücklich eine Funktion gemeint ist, den separaten Begriff „helper function“ verwenden.

## Package
What: An npm package, such as `nuxt`, `@nuxt/kit` or a module, that a project installs into `node_modules`.
Translations:
- fr: package
- de: Paket
Forms:
- fr: paquet
- de: Pakete, Paketen, Pakets

## Build
What: The step `nuxt build` runs to bundle the app and its server into `.output/`, or the output it writes.
Translations:
- fr: translate
- de: erzeugen
Forms:
- de: erzeugt, erzeugte, erzeugten, Erzeugung, Erzeugungen, Build, Builds
Hints:
- fr: as a noun keep "build" (le build, au moment du build); as a verb use "compiler" or "construire"
- de: Kontextabhängig: als Verb „erzeugen“; als Substantiv „Build“ (z. B. ein Build) oder „Erzeugung“. Nicht „bauen“ oder „builden“.
