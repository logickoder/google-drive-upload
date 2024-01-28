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

  console.log(`Uploading ${filename} to ${folderId}`)

  const media = {
    mimeType,
    body: fs.createReadStream(filename)
  }

  try {
    console.log(`Target file name: ${name}`)
    if (driveFile?.id) {
      console.log(`Updating file: ${driveFile.name} (${driveFile.id})`)
      await service.files.update({
        fileId: driveFile.id,
        media,
        addParents: folderId,
        supportsAllDrives: true
      })
    } else {
      console.log('No files found. Creating a new file')
      await service.files.create({
        requestBody: {
          name,
          parents: [folderId]
        },
        media,
        supportsAllDrives: true
      })
    }
    // await (driveFile?.id
    //   ? service.files.update({
    //       fileId: driveFile.id,
    //       media,
    //       addParents: folderId,
    //       supportsAllDrives: true
    //     })
    //   : service.files.create({
    //       requestBody: {
    //         name,
    //         parents: [folderId]
    //       },
    //       media,
    //       supportsAllDrives: true
    //     }))
    console.log(`File ${driveFile?.id ? 'updated' : 'uploaded'}`)
  } catch (e) {
    githubActions.setFailed(
      `${driveFile?.id ? 'Updating' : 'Creating'} file failed with error: ${e}`
    )
  }
}
