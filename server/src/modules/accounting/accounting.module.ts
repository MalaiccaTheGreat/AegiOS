import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AccountingService } from '../services/accounting/accounting.service';
import { AccountingController } from '../controllers/accounting/accounting.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ValidationPipe as CustomValidationPipe } from '../common/pipes/validation.pipe';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
  ],
  exports: [AccountingService],
})
export class AccountingModule {}
