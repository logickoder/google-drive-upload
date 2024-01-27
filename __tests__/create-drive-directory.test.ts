import * as core from '@actions/core'
import { drive_v3 } from '@googleapis/drive'
import createDriveDirectory from '../src/create-drive-directory'

jest.mock('@actions/core')

describe('createDriveDirectory', () => {
  let mockDriveService: jest.Mocked<drive_v3.Drive>

  let mockListResponse: jest.MockedFn<any>
  let mockCreateResponse: jest.MockedFn<any>

  beforeEach(() => {
    // Mocking the Drive service
    mockDriveService = {
      files: {
        list: jest.fn(),
        create: jest.fn()
      }
    } as unknown as jest.Mocked<drive_v3.Drive>

    mockListResponse = mockDriveService.files.list as jest.MockedFn<any>
    mockCreateResponse = mockDriveService.files.create as jest.MockedFn<any>
  })

  it('creates a new folder if not found', async () => {
    // Mocking the files.list method to return an empty list
    mockListResponse.mockResolvedValueOnce({
      data: {
        files: []
      }
    })

    // Mocking the files.create method
    mockCreateResponse.mockResolvedValueOnce({
      data: {
        id: 'newFolderId'
      }
    })

    const folderId = 'parentFolderId'
    const folderName = 'NewFolder'

    const result = await createDriveDirectory(
      mockDriveService,
      folderId,
      folderName
    )

    expect(result).toEqual('newFolderId')

    // Expectations for API calls
    expect(mockDriveService.files.list).toHaveBeenCalledWith({
      fields: 'files(name,id,mimeType,parents)',
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
      supportsAllDrives: true
    })

    expect(mockDriveService.files.create).toHaveBeenCalledWith({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId]
      },
      fields: 'id',
      supportsAllDrives: true
    })

    // Expectation for logging
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('returns existing folder ID if found', async () => {
    // Mocking the files.list method to return an existing folder
    mockListResponse.mockResolvedValueOnce({
      data: {
        files: [
          {
            id: 'existingFolderId',
            parents: ['parentFolderId']
          }
        ]
      }
    })

    const folderId = 'parentFolderId'
    const folderName = 'ExistingFolder'

    const result = await createDriveDirectory(
      mockDriveService,
      folderId,
      folderName
    )

    expect(result).toEqual('existingFolderId')

    // Expectations for API calls
    expect(mockDriveService.files.list).toHaveBeenCalledWith({
      fields: 'files(name,id,mimeType,parents)',
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
      supportsAllDrives: true
    })

    // Expectations for logging
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('handles errors and sets failed status', async () => {
    // Mocking the files.list method to throw an error
    mockListResponse.mockRejectedValueOnce(new Error('Some error'))

    const folderId = 'parentFolderId'
    const folderName = 'ErrorFolder'

    const result = await createDriveDirectory(
      mockDriveService,
      folderId,
      folderName
    )

    expect(result).toBeNull()

    // Expectations for API calls
    expect(mockDriveService.files.list).toHaveBeenCalledWith({
      fields: 'files(name,id,mimeType,parents)',
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
      supportsAllDrives: true
    })

    // Expectations for logging
    expect(core.setFailed).toHaveBeenCalledWith(
      'Unable to check for/create folder: Some error'
    )
  })
})
