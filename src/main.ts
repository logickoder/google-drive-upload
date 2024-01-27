import * as core from '@actions/core'
import * as google from '@googleapis/drive'
import { glob } from 'glob'
import * as path from 'path'
import uploadFile from './upload-file'
import createDriveDirectory from './create-drive-directory'

export async function run(): Promise<void> {
  try {
    const filename = core.getInput(inputs.filename, { required: true })

    const files = await glob(filename)
    console.log(`Files: ${files}`)

    if (!files || files.length === 0) {
      core.setFailed(`No file found! Pattern: ${filename}`)
    }

    const overwrite = core.getInput(inputs.overwrite) === 'true'
    if (!overwrite) {
      core.warning(`${inputs.overwrite} is disabled.`)
    }

    const name = core.getInput(inputs.name)

    let folderId = core.getInput(inputs.folderId, { required: true })

    const mimeType = core.getInput(inputs.mimeType)

    const useCompleteSourceName =
      core.getInput(inputs.useCompleteSourceName) === 'true'
    if (!useCompleteSourceName) {
      core.warning(`${inputs.useCompleteSourceName} is disabled.`)
    }

    const mirrorDirectoryStructure =
      core.getInput(inputs.mirrorDirectoryStructure) === 'true'
    if (!mirrorDirectoryStructure) {
      core.warning(`${inputs.mirrorDirectoryStructure} is disabled.`)
    }

    const filenamePrefix = core.getInput(inputs.namePrefixInput)

    const credentials = core.getInput(inputs.credentials, { required: true })

    core.setSecret(credentials)

    const drive = google.drive({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: [inputs.scope]
      })
    })

    const useSourceFilename = files.length > 1

    console.log(`Use source filename: ${useSourceFilename}`)

    // Save the folderId because it might get overwritten by createDriveDirectory
    const originalFolderId = folderId

    console.log(`Original folder ID: ${originalFolderId}`)

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
    core.setFailed(error as Error)
  }
}

export const inputs = {
  scope: 'https://www.googleapis.com/auth/drive.file',
  filename: 'filename',
  name: 'name',
  folderId: 'folderId',
  credentials: 'credentials',
  overwrite: 'overwrite',
  mimeType: 'mimeType',
  useCompleteSourceName: 'useCompleteSourceFilenameAsName',
  mirrorDirectoryStructure: 'mirrorDirectoryStructure',
  namePrefixInput: 'namePrefix'
}
