# g-drive-upload

[![GitHub Super-Linter](https://github.com/logickoder/google-drive-upload/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/logickoder/google-drive-upload/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/logickoder/google-drive-upload/actions/workflows/check-dist.yml/badge.svg)](https://github.com/logickoder/google-drive-upload/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/logickoder/google-drive-upload/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/logickoder/google-drive-upload/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

GitHub action that uploads files to Google Drive. **Supports both OAuth and Service Account authentication!**

Based on the go version of the same name by
[adityak74](https://github.com/adityak74/google-drive-upload-git-action)

## Authentication Methods

### OAuth Authentication (Recommended)

Since Google has deprecated service accounts for personal Google Drive uploads, OAuth is now the recommended
authentication method.

To set up OAuth:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen
6. Create an OAuth 2.0 client ID for a "Desktop application"
7. Download the client configuration
8. Use the OAuth 2.0 Playground or your own app to generate a refresh token

### Service Account Authentication (Legacy)

**Note: This method may not work for personal Google Drive accounts due to Google's policy changes. Use OAuth instead.**

To make a GSA go to the
[Credentials Dashboard](https://console.cloud.google.com/apis/credentials). You
will need to download the **.json key**. You will use this string as the
`credentials` input.

You will also need to **share the drive with the service account.** To do this,
just share the folder like you would normally with a friend, except you share it
with the service account email address. Additionally, you will need to give the
service account access to the Google Drive API. Go to
`https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project={PROJECT_ID}`.
Where `{PROJECT_ID}` is the ID of your GCP project. Find more info about that
[here.](https://support.google.com/googleapi/answer/7014113?hl=en)

## Inputs

### Authentication Inputs

#### `authType`

Required: **NO** (defaults to 'service')

Authentication type: `oauth` or `service`. Use `oauth` for OAuth authentication or `service` for service account
authentication.

#### OAuth Inputs (when authType is 'oauth')

##### `clientId`

Required: **YES** (when using OAuth)

OAuth client ID for Google Drive API.

##### `clientSecret`

Required: **YES** (when using OAuth)

OAuth client secret for Google Drive API.

##### `refreshToken`

Required: **YES** (when using OAuth)

OAuth refresh token for Google Drive API.

#### Service Account Input (when authType is 'service')

##### `credentials`

Required: **YES** (when using Service Account)

The service account credentials JSON as a string.

### File Upload Inputs

### `filename`

Required: **YES**.

The name of the file you want to upload. Wildcards can be used to upload more
than one file.

### `folderId`

Required: **YES**.

The ID of the parent folder you want to upload the file in.

### `name`

Required: **NO**

The name you want the file to have in Google Drive. If this input is not
provided, it will use only the filename of the source path. It will be ignored
if there are more than one file to be uploaded.

### `overwrite`

Required: **NO**

If you want to overwrite the filename with existing file, it will use the target
filename.

### `mimeType`

Required: **NO**

file MimeType. If absent, Google Drive will attempt to automatically detect an
appropriate value.

### `useCompleteSourceFilenameAsName`

Required: **NO**

If true, the target filename will be the complete source filename and `name`
parameter will be ignored.

### `mirrorDirectoryStructure`

Required: **NO**

If true, the directory structure of the source file will be recreated relative
to `folderId`.

### `namePrefix`

Required: **NO**

Prefix to be added to target filename.

## Usage Example

### Simple Workflow

In this example we stored the folderId and credentials as action secrets. This
is highly recommended as leaking your credentials key will allow anyone to use
your service account.

```yaml
# .github/workflows/main.yml
name: Main
on: [ push ]

jobs:
  my_job:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Archive files
        run: |
          sudo apt-get update
          sudo apt-get install zip
          zip -r archive.zip *

      - name: Upload to Google Drive
        uses: logickoder/g-drive-upload@main
        with:
          credentials: ${{ secrets.credentials }}
          filename: 'archive.zip'
          folderId: ${{ secrets.folderId }}
          name: 'documentation.zip' # optional string
          overwrite: 'true' # optional boolean
      - name: Make Directory Structure
        run: |
          mkdir -p w/x/y
          date +%s > w/x/y/z
      - name: Mirror Directory Structure
        uses: logickoder/g-drive-upload@main
        with:
          credentials: ${{ secrets.DRIVE_CREDENTIALS }}
          filename: w/x/y/z
          folderId: ${{ secrets.folderId }}
          overwrite: 'true'
          mirrorDirectoryStructure: 'true'
```

## Usage Examples

### OAuth Authentication (Recommended)

```yaml
# .github/workflows/main.yml
name: Main
on: [ push ]

jobs:
  my_job:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Archive files
        run: |
          sudo apt-get update
          sudo apt-get install zip
          zip -r archive.zip *

      - name: Upload to Google Drive with OAuth
        uses: logickoder/g-drive-upload@main
        with:
          authType: 'oauth'
          clientId: ${{ secrets.GOOGLE_CLIENT_ID }}
          clientSecret: ${{ secrets.GOOGLE_CLIENT_SECRET }}
          refreshToken: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
          filename: 'archive.zip'
          folderId: ${{ secrets.FOLDER_ID }}
          name: 'documentation.zip' # optional string
          overwrite: 'true' # optional boolean
```

### Service Account Authentication (Legacy)

In this example we stored the folderId and credentials as action secrets. This
is highly recommended as leaking your credentials key will allow anyone to use
your service account.

```yaml
# .github/workflows/main.yml
name: Main
on: [ push ]

jobs:
  my_job:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Archive files
        run: |
          sudo apt-get update
          sudo apt-get install zip
          zip -r archive.zip *

      - name: Upload to Google Drive
        uses: logickoder/g-drive-upload@main
        with:
          authType: 'service'  # optional, defaults to 'service'
          credentials: ${{ secrets.GOOGLE_CREDENTIALS }}
          filename: 'archive.zip'
          folderId: ${{ secrets.FOLDER_ID }}
          name: 'documentation.zip' # optional string
          overwrite: 'true' # optional boolean

      - name: Make Directory Structure
        run: |
          mkdir -p w/x/y
          date +%s > w/x/y/z

      - name: Mirror Directory Structure
        uses: logickoder/g-drive-upload@main
        with:
          credentials: ${{ secrets.GOOGLE_CREDENTIALS }}
          filename: w/x/y/z
          folderId: ${{ secrets.FOLDER_ID }}
          overwrite: 'true'
          mirrorDirectoryStructure: 'true'
```

## Migration from Service Account to OAuth

To migrate from service account authentication to OAuth:

1. Set up OAuth credentials as described in the OAuth Authentication section
2. Store your OAuth credentials as GitHub secrets:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `GOOGLE_REFRESH_TOKEN`
3. Update your workflow to use `authType: 'oauth'` and the OAuth credentials
4. Remove the old `credentials` secret (optional, for cleanup)

The action maintains backward compatibility, so existing workflows using service accounts will continue to work without
changes.
