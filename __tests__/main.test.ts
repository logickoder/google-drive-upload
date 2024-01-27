import * as core from '@actions/core'
import * as google from '@googleapis/drive'
import { inputs, run } from '../src/main'
import uploadFile from '../src/upload-file'
import createDriveDirectory from '../src/create-drive-directory'
import { drive_v3 } from '@googleapis/drive'
import { glob } from 'glob'

// Mocking external dependencies
jest.mock('@actions/core')
jest.mock('@googleapis/drive')
jest.mock('glob')
jest.mock('../src/upload-file')
jest.mock('../src/create-drive-directory')

describe('Main', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('should handle successful execution', async () => {
    // Mocking inputs
    jest.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case inputs.filename:
          return 'your-filename-pattern'
        case inputs.overwrite:
          return 'true'
        case inputs.credentials:
          return '{}'
        default:
          return ''
      }
    })

    // Mocking the glob result
    jest.mocked(glob).mockResolvedValue(['file1.txt', 'file2.txt'])

    // Mocking Google Drive API calls
    jest
      .mocked(google.drive)
      .mockReturnValueOnce(jest.fn() as unknown as jest.Mocked<drive_v3.Drive>)

    // Mocking uploadFile function
    jest.mocked(uploadFile).mockResolvedValueOnce()

    // Mocking createDriveDirectory function
    jest.mocked(createDriveDirectory).mockResolvedValueOnce('mocked-folder-id')

    // Running the script
    await run()

    // Assertions

    // Check if core functions were called as expected
    expect(core.getInput).toHaveBeenCalledWith('filename', { required: true })
    expect(core.getInput).toHaveBeenCalledWith('overwrite')

    // Check if the glob function was called with the correct parameters
    expect(glob).toHaveBeenCalledWith('your-filename-pattern')

    // Check if Google Drive API was initialized with the correct parameters
    expect(google.drive).toHaveBeenCalledWith({
      version: 'v3',
      auth: expect.any(Object)
    })
  })

  it('should handle errors gracefully', async () => {
    // Mocking inputs
    jest.mocked(core.getInput).mockReturnValueOnce('invalid-pattern')

    // Mock actions core functions
    jest.mocked(core.setFailed).mockImplementationOnce(message => {
      throw message instanceof Error ? message : new Error(message)
    })

    // Mocking the glob result
    jest.mocked(glob).mockResolvedValue([])

    // Running the script
    await run()

    // Assertions

    // Check if core.setFailed was called with the correct error message
    expect(core.setFailed).toHaveBeenCalledWith(
      new Error('No file found! Pattern: invalid-pattern')
    )
  })
})
