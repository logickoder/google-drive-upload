import * as fs from 'fs'
import * as githubActions from '@actions/core'
import { drive_v3 } from '@googleapis/drive'

export default async function uploadToDrive(
  service: drive_v3.Drive,
  filename: string,
  folderId: string,
  driveFile: drive_v3.Schema$File | null,
  name: string,
  mimeType: string
): Promise<void> {
  const stats = fs.lstatSync(filename)

  if (stats.isDirectory()) {
    console.log(`${filename} is a directory. Skipping upload.`)
    return
  }

  const media = {
    mimeType,
    body: fs.createReadStream(filename)
  }

  try {
    await (driveFile?.id
      ? service.files.update({
          fileId: driveFile.id,
          media,
          addParents: folderId,
          supportsAllDrives: true
        })
      : service.files.create({
          requestBody: {
            name,
            parents: [folderId]
          },
          media,
          supportsAllDrives: true
        }))
    console.log(`File ${driveFile?.id ? 'updated' : 'uploaded'}`)
  } catch (e) {
    githubActions.setFailed(
      `${driveFile?.id ? 'Updating' : 'Creating'} file failed with error: ${e}`
    )
  }
}
