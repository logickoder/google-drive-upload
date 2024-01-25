import * as fs from 'fs'
import * as githubActions from '@actions/core'
import { drive_v3 } from '@googleapis/drive'

export default async function uploadToDrive(
  service: drive_v3.Drive,
  filename: string,
  folderId: string,
  driveFile: any,
  name: string,
  mimeType: string
) {
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
    await (
      driveFile ? service.files
        .update({
          fileId: driveFile.id,
          media: media,
          addParents: folderId,
          supportsAllDrives: true
        }) : service.files
        .create({
          requestBody: {
            name: name,
            parents: [folderId]
          },
          media: media,
          supportsAllDrives: true
        })
    )
    console.log(`File ${driveFile ? 'updated' : 'uploaded'}`)
  } catch (e) {
    githubActions.setFailed(`${driveFile ? 'Updating' : 'Creating'} file failed with error: ${e}`)
  }
}