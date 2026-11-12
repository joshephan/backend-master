import { Controller, Get, Param, Post, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';

const MB = 1024 * 1024;
const EXPORT_FILE = process.env.EXPORT_FILE ?? 'sales.csv';

@Controller('concerts/:id')
export class FilesController {
  // multer 단계에서 5MB 상한
  @Post('poster')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * MB } }))
  poster(@UploadedFile() file: Express.Multer.File) {
    return { name: file.originalname, size: file.size, mimetype: file.mimetype };
  }

  // 파일을 조각내어 흘려보냄
  @Get('sales-export')
  exportStream(@Param('id') id: string) {
    return new StreamableFile(createReadStream(EXPORT_FILE), {
      type: 'text/csv',
      disposition: `attachment; filename="sales-${id}.csv"`,
    });
  }
}
