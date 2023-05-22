import { randomUUID } from 'crypto'
import { extname, resolve } from 'node:path'
import { FastifyInstance } from 'fastify'
import { WriteStream, createWriteStream } from 'fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

const pump = promisify(pipeline)

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request, reply) => {
    const upload = await request.file({
      limits: {
        fileSize: 5_242_880, // 5Mb
      },
    })

    if (!upload) {
      return reply.status(400).send()
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/
    const isValidFileFormat = mimeTypeRegex.test(upload.mimetype)

    if (!isValidFileFormat) {
      return reply.status(400).send()
    }

    const fileId = randomUUID()
    const extension = extname(upload.filename)

    const filename = fileId.concat(extension)

    const writeStream = createWriteStream(
      resolve(__dirname, '../../uploads', filename),
    )

    //* Serviços para salvar uploads: Amazon S3, Google GCS, CloudFlare R2

    await pump(upload.file, WriteStream)

    const fullUrl = request.protocol.concat('://').concat(request.hostname)
    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString()

    return { fileUrl }
  })
}
