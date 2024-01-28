import * as fs from 'fs'
import * as githubActions from '@actions/core'
import { drive_v3 } from '@googleapis/drive'
import uploadToDrive from '../src/upload-to-drive'

jest.mock('fs', () => ({
  lstatSync: jest.fn(),
  createReadStream: jest.fn()
}))

jest.mock('@actions/core', () => ({
  setFailed: jest.fn()
}))

describe('uploadToDrive', () => {
  let mockDriveService: jest.Mocked<drive_v3.Drive>

  const mockDriveFile: drive_v3.Schema$File | null = {
    id: 'mockFileId'
    // Add other required properties based on your use case
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockDriveService = {
      files: {
        update: jest.fn(),
        create: jest.fn()
      }
    } as unknown as jest.Mocked<drive_v3.Drive>
  })

  it('should skip upload for directories', async () => {
    ;(fs.lstatSync as jest.Mock).mockReturnValueOnce({
      isDirectory: () => true
    })

    await uploadToDrive(
      mockDriveService,
      'mockFileName',
      'mockFolderId',
      mockDriveFile,
      'mockName',
      'mockMimeType'
    )

    expect(fs.lstatSync).toHaveBeenCalledWith('mockFileName')
    expect(githubActions.setFailed).not.toHaveBeenCalled()
  })

  it('should update file successfully', async () => {
    ;(fs.lstatSync as jest.Mock).mockReturnValueOnce({
      isDirectory: () => false
    })
    ;(fs.createReadStream as jest.Mock).mockReturnValueOnce('mockReadStream')

    await uploadToDrive(
      mockDriveService,
      'mockFileName',
      'mockFolderId',
      mockDriveFile,
      'mockName',
      'mockMimeType'
    )

    expect(fs.lstatSync).toHaveBeenCalledWith('mockFileName')
    expect(fs.createReadStream).toHaveBeenCalledWith('mockFileName')

    expect(mockDriveService.files.update).toHaveBeenCalledWith({
      fileId: 'mockFileId',
      media: {
        mimeType: 'mockMimeType',
        body: 'mockReadStream'
      },
      addParents: 'mockFolderId',
      supportsAllDrives: true
    })

    expect(githubActions.setFailed).not.toHaveBeenCalled()
  })

  it('should create file successfully', async () => {
    ;(fs.lstatSync as jest.Mock).mockReturnValueOnce({
      isDirectory: () => false
    })
    ;(fs.createReadStream as jest.Mock).mockReturnValueOnce('mockReadStream')

    await uploadToDrive(
      mockDriveService,
      'mockFileName',
      'mockFolderId',
      null,
      'mockName',
      'mockMimeType'
    )

    expect(fs.lstatSync).toHaveBeenCalledWith('mockFileName')
    expect(fs.createReadStream).toHaveBeenCalledWith('mockFileName')

    expect(mockDriveService.files.create).toHaveBeenCalledWith({
      requestBody: {
        name: 'mockName',
        parents: ['mockFolderId']
      },
      media: {
        mimeType: 'mockMimeType',
        body: 'mockReadStream'
      },
      supportsAllDrives: true
    })

    expect(githubActions.setFailed).not.toHaveBeenCalled()
  })

  it('should handle errors during upload', async () => {
    ;(fs.lstatSync as jest.Mock).mockReturnValueOnce({
      isDirectory: () => false
    })
    ;(fs.createReadStream as jest.Mock).mockReturnValueOnce('mockReadStream')

    const mockError = new Error('Mock error')
    ;(mockDriveService.files.update as jest.Mock).mockRejectedValueOnce(
      mockError
    )

    await uploadToDrive(
      mockDriveService,
      'mockFileName',
      'mockFolderId',
      mockDriveFile,
      'mockName',
      'mockMimeType'
    )

    expect(fs.lstatSync).toHaveBeenCalledWith('mockFileName')
    expect(fs.createReadStream).toHaveBeenCalledWith('mockFileName')

    const expectedErrorMessage = `${mockDriveFile ? 'Updating' : 'Creating'} file failed with error: ${mockError}`
    expect(githubActions.setFailed).toHaveBeenCalledWith(expectedErrorMessage)
  })
})
