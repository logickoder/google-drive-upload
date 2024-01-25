import * as core from '@actions/core'
import google from '@googleapis/drive'
import { glob } from 'glob'
import { uploadFile } from './uploadFile'
import * as path from 'path'
import createDriveDirectory from './createDriveFolder'

export async function run(): Promise<void> {
  try {
    const filename = getInput(inputs.filename, true)

    const files = await glob(filename)
    console.log(`Files: ${files}`)

    if (files.length === 0) {
      core.setFailed(`No file found! Pattern: ${filename}`)
    }

    const overwrite = getInput(inputs.overwrite) === 'true'
    if (!overwrite) {
      core.warning(`${inputs.overwrite} is disabled.`)
    }

    const name = getInput(inputs.name)

    let folderId = getInput(inputs.folderId, true)

    const mimeType = getInput(inputs.mimeType)

    const useCompleteSourceName = getInput(inputs.useCompleteSourceName) === 'true'
    if (!useCompleteSourceName) {
      core.warning(`${inputs.useCompleteSourceName} is disabled.`)
    }

    const mirrorDirectoryStructure = getInput(inputs.mirrorDirectoryStructure) === 'true'
    if (!mirrorDirectoryStructure) {
      core.warning(`${inputs.mirrorDirectoryStructure} is disabled.`)
    }

    const filenamePrefix = getInput(inputs.namePrefixInput)

    const credentials = getInput(inputs.credentials, true).trim()

    core.setSecret(credentials)

    const drive = google.drive({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: [inputs.scope]
      })
    })

    const useSourceFilename = files.length > 1

    // Save the folderId because it might get overwritten by createDriveDirectory
    const originalFolderId = folderId

    for (const file of files) {
      folderId = originalFolderId
      let targetName: string
      console.log(`Processing file ${file}`)

      if (mirrorDirectoryStructure) {
        const directoryStructure = path.dirname(file).split(path.sep)
        console.log(`Mirroring directory structure: ${directoryStructure}`)
        for (const dir of directoryStructure) {
          const id = await createDriveDirectory(drive, folderId, dir)
          if (id) {
            folderId = id
          }
        }
      }

      if (useCompleteSourceName) {
        targetName = file
      } else if (useSourceFilename || !name) {
        targetName = path.basename(file)
      } else {
        targetName = name
      }

      if (!targetName) {
        core.setFailed('Could not discover target file name')
      } else if (filenamePrefix) {
        targetName = filenamePrefix + targetName
      }

      await uploadFile(drive, file, folderId, targetName, mimeType, overwrite)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function getInput(name: string, required: boolean = false): string {
  const value = core.getInput(name)
  if (required && !value) {
    core.setFailed(`Missing input '${name}'`)
  }
  return value
}

const inputs = {
  scope: 'https://www.googleapis.com/auth/drive.file',
  filename: 'filename',
  name: 'name',
  folderId: 'folderId',
  credentials: 'credentials',
  overwrite: 'false',
  mimeType: 'mimeType',
  useCompleteSourceName: 'useCompleteSourceFilenameAsName',
  mirrorDirectoryStructure: 'mirrorDirectoryStructure',
  namePrefixInput: 'namePrefix'
}