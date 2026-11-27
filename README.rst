dserver webapp
==============

.. image:: https://github.com/jic-dtool/dserver-webapp/actions/workflows/build-and-test.yml/badge.svg
    :target: https://github.com/jic-dtool/dserver-webapp/actions/workflows/build-and-test.yml
    :alt: dserver-webapp build and test

.. image:: https://img.shields.io/badge/License-MIT-yellow.svg
    :target: https://opensource.org/licenses/MIT
    :alt: License: MIT

- GitHub repository: https://github.com/jic-dtool/dserver-webapp
- License: MIT License (https://opensource.org/licenses/MIT)

This web application allows querying and displaying information about datasets stored in one or more base URIs.

Dependencies
------------

The web application requires two other web services:

1. dtool-lookup-server: https://github.com/jic-dtool/dservercore - Provides a means to search and display dataset metadata.
2. token-generator-ldap: https://github.com/jic-dtool/token-generator-ldap - Facilitates user authentication.

Setup
-----

Navigate to the `dserver-webapp` directory:

.. code-block:: bash

    cd dserver-webapp

Create a `.env` file in the `dserver-webapp` directory with the following contents:

.. code-block:: bash

    VUE_APP_DTOOL_LOOKUP_SERVER_URL="http://localhost:5000"
    VUE_APP_DTOOL_LOOKUP_SERVER_TOKEN_GENERATOR_URL="http://localhost:5001/token"

For deployment, replace these URLs with the actual endpoints of the lookup server and the token generator.

Command-line logins (``dtool dserver login``) are approved in the webapp: the
command shows a link to the webapp with ``?user_code=...``, which opens an
approval dialog after logging in. The dialog talks to the device authorization
endpoints of the dserver OAuth2 token plugin, by default
``${VUE_APP_DTOOL_LOOKUP_SERVER_URL}/auth/oauth2/device``; override with::

    VUE_APP_OAUTH2_DEVICE_URL="https://dserver.example.org/auth/oauth2/device"

Users log in from the command line with the address of the webapp (e.g.
``dtool dserver login https://dtool.example.org``): the page names its
dserver in ``<meta name="dserver-url">`` (``VUE_APP_DTOOL_LOOKUP_SERVER_URL``,
resolved relative to the page if relative), where ``dtool-dserver`` finds it.
The ``dtool cp`` commands shown for datasets use ``dserver://`` URIs with the
webapp's address accordingly.

Customization options for the landing page are available through the following environment variables in the `.env` file:

.. code-block:: text

   VUE_APP_FIRST_CONTAINER_TITLE=Log in
   VUE_APP_SECOND_CONTAINER_TITLE=dserver
   VUE_APP_SECOND_CONTAINER_MESSAGE=Welcome to <b>dserver</b>'s webapp.
   VUE_APP_THIRD_CONTAINER_HEADING=Access
   VUE_APP_THIRD_CONTAINER_MESSAGE=Some notes on how to gain access.
   VUE_APP_FOURTH_CONTAINER_HEADING=Docs
   VUE_APP_FOURTH_CONTAINER_INTRO=Some notes on how to find help. The following list may contain an arbitrary number of links.
   VUE_APP_FOURTH_CONTAINER_RESOURCES=[{"text": "dserver-webapp repository", "url": "https://github.com/jic-dtool/dserver-webapp"}]
   VUE_APP_LANDING_PAGE_ICON_PATH=/icons/128x128/dtool_logo.png

Customization options for the upper right corner drop-down menu in the app are available through the following environment variables in the `.env` file:

.. code-block:: text

   VUE_APP_OFFER_DTOOL_README_YAML_DOWNLOAD=true
   VUE_APP_OFFER_DTOOL_JSON_DOWNLOAD=true
   VUE_APP_SHOW_INFO_MENU_ENTRY=true
   VUE_APP_DTOOL_JSON_PATH=/data/templates/dtool.json
   VUE_APP_DTOOL_README_YAML_PATH=/data/templates/dtool_readme.yml
   VUE_APP_INFO_CONTENT="<tt>dtool.json</tt> is you local <i>dtool</i> client's configuration file. Place it at <tt>~/.config/dtool/dtool.json</tt>, where <tt>~</tt> is your home directoy, and create the directories if they do not exist.<br /><br /><tt>dtool_readme.yml</tt> is the metadata template used for documenting your datasets. Place it anywhere, but make sure that the entry <tt>DTOOL_README_TEMPLATE_FPATH</tt> within above's dtool.json points to the correct absolute path of your <tt>dtool_readme.yml</tt>. See <a href="https://dtool.readthedocs.io/en/latest/configuring_a_custom_readme_template.html" target="_blank" rel="noopener noreferrer">Configuring a custom README template</a> of <a href="https://dtool.readthedocs.io" target="_blank" rel="noopener noreferrer"></i>dtool</i>'s documentation</a>."

All paths provided in these environment variables must be relative to this
repository's `dserver-webapp/public` as root. 
Setting any of the `VUE_APP_OFFER_DTOOL_README_YAML_DOWNLOAD`,
`VUE_APP_OFFER_DTOOL_JSON_DOWNLOAD`, `VUE_APP_SHOW_INFO_MENU_ENTRY` to `true`
will show a download button for a `dtool_readme.yml` template, for a
`dtool.json` configuration file, and a button for displaying arbitrary
textual information configured with `VUE_APP_INFO_CONTENT`.
Per default, all these buttons are hidden.

To apply changes to the `.env` file, execute:

.. code-block:: bash

    npm install

Development Server
------------------

To start a development server:

.. code-block:: bash

    cd dserver-webapp
    npm run serve

Building for Production
-----------------------

To compile the application into a static single-page website:

.. code-block:: bash

    cd dserver-webapp
    npm run build

Tests, lint and type checking
-----------------------------

.. code-block:: bash

    cd dserver-webapp
    npm run test:unit    # Vitest
    npm run lint         # ESLint
    npm run type-check   # vue-tsc (TypeScript 6 API) and tsc (TypeScript 7)

The application is built with `Vite <https://vite.dev>`_. TypeScript 7 is
installed side by side with TypeScript 6 (package ``@typescript/typescript6``,
aliased as ``typescript``), because ``vue-tsc`` and ``typescript-eslint``
still need TypeScript's JavaScript API, which TypeScript 7.0 does not provide.

Fixing Broken Installations
---------------------------

To address issues with dependencies in a broken installation:

.. code-block:: bash

    rm -rf dist/ node_modules/
    npm ci
    npm run build

Additional Information
----------------------

For more details on development and build processes, refer to the `README.md` file within the `dserver-webapp` directory. For deployment instructions using Ansible, consult the `provision/README.rst`.
