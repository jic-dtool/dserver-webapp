CHANGELOG
=========

This project uses `semantic versioning <http://semver.org/>`_.
This change log uses principles from `keep a changelog <http://keepachangelog.com/>`_.

[0.5.0] - 2026-11-27
--------------------

The webapp for dserver (formerly dtool-lookup-server), rewritten with Vue 3,
TypeScript and Vuetify. Renamed from dtool-lookup-webapp to dserver-webapp.

Added
^^^^^

- Sign-in with OAuth2 through the dserver token generator plugin. The token
  arrives in the URL fragment (or, in cookie-only mode, from the server
  session), never in a query parameter. Logout ends the server session.
  ``VUE_APP_OAUTH2_LOGIN_URL`` configures the login URL.
- Optional authentication: ``VUE_APP_AUTH_ENABLED=false`` runs the webapp
  against an open dserver without sign-in.
- Approval of command-line logins (``dtool dserver login``): opening the webapp
  with ``?user_code=...`` shows, after logging in, a dialog to approve or deny
  the login (OAuth 2.0 device authorization flow of the dserver OAuth2 token
  plugin). Configure the endpoint with ``VUE_APP_OAUTH2_DEVICE_URL`` (default
  ``${serverUrl}/auth/oauth2/device``).
- The page names its dserver (``<meta name="dserver-url">``, from
  ``VUE_APP_DTOOL_LOOKUP_SERVER_URL``), so users can log in from the command
  line with the address of the webapp (``dtool dserver login <address>``).
- Copyable ``dtool cp`` commands and *Copy URI* buttons for storage locations
  and datasets, with ``dserver://`` URIs of the webapp's address (e.g. for
  ``dtool ls`` or ``dtool cp``), and the login command.
- Dependency graph drawn with Vue Flow in a layered layout: datasets flow
  left to right from the datasets they were derived from, with full names,
  creator and date, the current dataset highlighted, zoom and pan controls.
  Clicking a dataset opens it without replacing the search results.
  Datasets outside the current search filter (free text, mongo query,
  locations, tags, creators) are shown greyed out and cannot be opened; the
  server decides which datasets match, with the same search as the list.
- User management for administrators: users and admin rights, base URIs,
  search and register permissions on base URIs (granted as soon as a base URI
  is selected).
- User menu with the user's display name (editable), a button to copy the
  token, and optional downloads of ``dtool.json``/``dtool_readme.yml``
  templates and an info dialog.
- Editing of tags, annotations and the README; direct download of items
  (with the dserver signed URL plugin).
- Filters (facets) for storage locations, tags, creators and uploaders, and
  the uploader of a dataset. Storage locations are listed right below the
  Repository heading; all are selected by default.
- Datasets show their UUID below their name; clicking the dataset icon
  copies the URI.
- Search with free text or a mongo query (JSON), sorting, pagination with a
  selectable number of datasets per page, paginated item lists.
- README shown as rendered YAML/JSON or as plain text, depending on the
  server version.
- Server health check with a "Server unavailable" notice; notifications.
- Customizable landing page.
- Unit tests (Vitest).

Changed
^^^^^^^

- Renamed from dtool-lookup-webapp to dserver-webapp (GitHub repository,
  npm package and the application directory). The Ansible deployment in
  ``provision/`` keeps its role, nginx configuration and installation path.
- Vue 3 with the Composition API and TypeScript; Vuetify 4 (Material 3)
  instead of Bootstrap; Pinia instead of Vuex.
- Talks to dserver's remodelled REST API through the dserver-client package.
- Built with Vite instead of Vue CLI: ``npm run serve`` (or ``dev``),
  ``build`` and ``preview``. Configuration still comes from ``VUE_APP_*``
  environment variables and ``.env`` files, now read as
  ``import.meta.env.VUE_APP_*``. ``index.html`` moved to the project root.
  The dependency graph and the user management are loaded when first opened.
- TypeScript 7 is installed side by side with TypeScript 6
  (``@typescript/typescript6``, aliased as ``typescript``): vue-tsc and
  typescript-eslint need TypeScript's JavaScript API, which TypeScript 7.0
  does not have. ``npm run type-check`` runs vue-tsc and TypeScript 7's tsc.
- ESLint 10 runs directly (``npm run lint``, flat config
  ``eslint.config.mjs``).
- Node.js 22.22 or 24.15 and later are required (CI: 22, 24, 26).

Fixed
^^^^^

- The dependency graph was always empty: the webapp asked for the README key
  ``readme.derived_from.uuid`` instead of the server's
  ``readme_parsed.derived_from.uuid``. It now uses the server's dependency
  keys; the panel for editing them is gone.
- Dependency graphs with more than 10 datasets were cut off (first page only).
- Pagination of mongo query results.
- Responses of outdated searches replaced newer results; transient errors
  ended the session.
- ``dserver://`` URIs of datasets and storage locations in copied ``dtool``
  commands lacked the storage location or the server.

[0.4.0] - 2020-05-29
--------------------

Added
^^^^^

- Added ability to configure lookup server URL and token generator URL from
  environment file. Thanks to Lars Pastewka.



[0.3.0] - 2020-05-10
--------------------

Added
^^^^^

- Annotations component
- Display of dataset annotations when available
- Display of dataset tags
- Added drop down to create and copy the "dtool tag set" command
- Ability to filter datasets based on tags
- Ability to filter datasets by more than one base URI
- Ability to filter datasets by more than one creator username
- Added many small improvements to the layout and user experience
- Added button to allow a user to log out in cases where the token has expired



[0.2.1] - 2020-03-11
--------------------

Fixed
^^^^^

- Fixed defect in drop down to copy the "fetch item" command 


[0.2.0] - 2020-03-10
--------------------

Added
^^^^^

- Information about the number of items in a dataset
- More responsive loading of DatasetTable component
- Prettier layout of SummaryInfo component


[0.1.0] - 2019-07-08
--------------------

Initial release
