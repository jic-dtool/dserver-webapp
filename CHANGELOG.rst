CHANGELOG
=========

This project uses `semantic versioning <http://semver.org/>`_.
This change log uses principles from `keep a changelog <http://keepachangelog.com/>`_.

[Unreleased]
------------

Added
^^^^^

- Dependency graph drawn with Vue Flow in a layered layout: datasets flow
  left to right from the datasets they were derived from, with full names,
  creator and date, the current dataset highlighted, zoom and pan controls.
  Clicking a dataset opens it without replacing the search results.

- Approval of command-line logins (``dtool dserver login``): opening the webapp
  with ``?user_code=...`` shows, after logging in, a dialog to approve or deny
  the login (OAuth 2.0 device authorization flow of the dserver OAuth2 token
  plugin). Configure the endpoint with ``VUE_APP_OAUTH2_DEVICE_URL`` (default
  ``${serverUrl}/auth/oauth2/device``).
- The page names its dserver (``<meta name="dserver-url">``, from
  ``VUE_APP_DTOOL_LOOKUP_SERVER_URL``), so users can log in from the command
  line with the address of the webapp (``dtool dserver login <address>``).
  The copied ``dtool cp`` commands use ``dserver://`` URIs with the webapp's
  address and show the login command.
- *Copy URI* buttons for storage locations and datasets, which copy the
  ``dserver://`` URI (e.g. for ``dtool ls`` or ``dtool cp``).
- Customizable landing page.
- Logout button.
- Search result pagniation.
- Selection of entry number per page.
- Version-dependent display of pagination.
- Version-dependent display of README.yml content as clear text or as processed YAML/JSON.
- A few simple unit tests.


Changed
^^^^^^^

- User management: a search or register permission is granted as soon as a
  base URI is selected; the "+" button is gone.

- Locations are listed right below the Repository heading, always open,
  above the dataset counts and the other filters. Datasets of the selected
  locations are shown; all are selected by default, and at least one stays
  selected.
- Datasets show their UUID instead of their URI; *Copy URI* copies the URI.
- Updated from bootstrap-vue-3 to bootstap-vue-next
- Adapted routes to remodeled dserver REST API.


Deprecated
^^^^^^^^^^


Removed
^^^^^^^


Fixed
^^^^^

- The dependency graph was always empty: the webapp asked for the README key
  ``readme.derived_from.uuid`` instead of the server's
  ``readme_parsed.derived_from.uuid``. It now uses the server's dependency
  keys; the panel for editing them is gone.
- Dependency graphs with more than 10 datasets were cut off (first page only).

- No search box on login screen.
- ``dserver://`` URIs of datasets and storage locations in copied ``dtool``
  commands lacked the storage location or the server.

Security
^^^^^^^^


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
