import { drive_v3 } from '@googleapis/drive'
import * as core from '@actions/core'
import uploadToDrive from './upload-to-drive'

export default async function uploadFile(
  service: drive_v3.Drive,
  filename: string,
  folderId: string,
  name: string,
  mimeType: string,
  overwrite: boolean
): Promise<void> {
  console.log(`Target file name: ${name}`)

  let currentFile = null

  if (overwrite) {
    try {
      const response = await service.files.list({
        fields: 'files(name,id,mimeType,parents)',
        q: `name='${name}'`,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
        supportsAllDrives: true
      })

      const files = response.data.files || []

      console.log(`Found ${files.length} file(s)`)

      for (const file of files) {
        let found = false

        if (name === file.name) {
          currentFile = file

          for (const parentId of file?.parents || []) {
            if (parentId === folderId) {
              console.log('File found in expected folder')
              found = true
              break
            }
          }
        }

        if (found) {
          break
        }
      }

      if (currentFile) {
        console.log(`Overwriting file: ${currentFile.name} (${currentFile.id})`)
      } else {
        console.log('No similar files found. Creating a new file')
      }
    } catch (err) {
      core.setFailed(`Unable to retrieve files: ${err}`)
    }
  }

  await uploadToDrive(service, filename, folderId, currentFile, name, mimeType)
}
