import * as core from '@actions/core'
import { drive_v3 } from '@googleapis/drive'

export default async function createDriveDirectory(
  service: drive_v3.Drive,
  folderId: string,
  name: string
): Promise<string | null | undefined> {
  console.log(`Checking for existing folder ${name}`)

  try {
    const response = await service.files.list({
      fields: 'files(name,id,mimeType,parents)',
      q: `name='${name}' and mimeType='application/vnd.google-apps.folder'`,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
      supportsAllDrives: true
    })

    const foundFolders =
      response.data.files?.filter(
        (file: any) => file.parents && file.parents.includes(folderId)
      ) || []

    if (foundFolders.length === 0) {
      console.log(`Creating folder: ${name}`)

      const response = await service.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folderId]
        },
        fields: 'id',
        supportsAllDrives: true
      })

      return response.data.id
    } else {
      console.log(`Found existing folder ${name}.`)
      return foundFolders[0].id
    }
  } catch (err) {
    core.setFailed(`Unable to check for/create folder: ${err}`)
    return null
  }
}
