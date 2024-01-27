import { drive_v3 } from '@googleapis/drive'
import uploadFile from '../src/upload-file'
import uploadToDrive from '../src/upload-to-drive'

// Mocking the required dependencies
jest.mock('@actions/core')

// Mocking the uploadToDrive function
jest.mock('../src/upload-to-drive', () => jest.fn())

describe('uploadFile function', () => {
  let mockDriveService: jest.Mocked<drive_v3.Drive>

  let mockListResponse: jest.MockedFn<any>

  beforeEach(() => {
    // Mocking the Drive service
    mockDriveService = {
      files: {
        list: jest.fn()
      }
    } as unknown as jest.Mocked<drive_v3.Drive>

    mockListResponse = mockDriveService.files.list as jest.MockedFn<any>
  })

  it('should upload file to Drive', async () => {
    mockListResponse.mockResolvedValueOnce({
      data: {
        files: [
          {
            name: 'file.txt',
            id: 'existing-file-id',
            mimeType: 'text/plain',
            parents: [
              /* parent folder IDs */
            ]
          }
        ]
      }
    })

    await testUploadToDrive(mockDriveService, () => expect.any(Object))
  })

  it('should handle no similar files found', async () => {
    // Mocking the response from service.files.list
    mockListResponse.mockResolvedValueOnce({
      data: {
        files: []
      }
    })

    await testUploadToDrive(mockDriveService, () => null)
  })
})

const testUploadToDrive = async (
  service: jest.Mocked<drive_v3.Drive>,
  currentFile: () => jest.Mocked<drive_v3.Schema$File | null | undefined>
): Promise<void> => {
  const mock = uploadToDrive as jest.MockedFunction<typeof uploadToDrive>
  mock.mockImplementationOnce(async () => Promise.resolve()) // Assuming uploadToDrive resolves successfully

  const filename = 'local-file.txt'
  const folderId = 'folder-id'
  const name = 'file.txt'
  const mimeType = 'text/plain'

  await uploadFile(service, filename, folderId, name, mimeType, true)
  expect(mock).toHaveBeenCalledWith(
    service,
    filename,
    folderId,
    currentFile(), // This would be the 'currentFile' parameter
    name,
    mimeType
  )
}
