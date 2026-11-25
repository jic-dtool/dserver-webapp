CHANGELOG
=========

This project uses `semantic versioning <http://semver.org/>`_.
This change log uses principles from `keep a changelog <http://keepachangelog.com/>`_.

[Unreleased]
------------

Added
^^^^^

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
- Customizable landing page.
- Logout button.
- Search result pagniation.
- Selection of entry number per page.
- Version-dependent display of pagination.
- Version-dependent display of README.yml content as clear text or as processed YAML/JSON.
- A few simple unit tests.


Changed
^^^^^^^

- Updated from bootstrap-vue-3 to bootstap-vue-next
- Adapted routes to remodeled dserver REST API.


Deprecated
^^^^^^^^^^


Removed
^^^^^^^


Fixed
^^^^^

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
