import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AccountingService } from '../../services/accounting/accounting.service';
import { CreateTransactionDto, GenerateReportDto, FileTaxReturnDto } from '../../services/accounting/dto/accounting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Accounting')
@ApiBearerAuth()
@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('transactions')
  async getTransactions(@Query('businessId') businessId: string) {
    return this.accountingService.getFinancialData(businessId);
  }

  @Post('transactions')
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.accountingService.createTransaction(createTransactionDto);
  }

  @Get('transactions/:id')
  async getTransaction(@Param('id') id: string) {
    return this.accountingService.getTransaction(id);
  }

  @Post('reports/generate')
  async generateReport(@Body() generateReportDto: GenerateReportDto) {
    return this.accountingService.generateReport(generateReportDto);
  }

  @Get('taxes/filings')
  async getTaxFilings(@Query('businessId') businessId: string) {
    return this.accountingService.getTaxFilings(businessId);
  }

  @Post('taxes/file')
  async fileTaxReturn(@Body() fileTaxReturnDto: FileTaxReturnDto) {
    return this.accountingService.fileTaxReturn(fileTaxReturnDto);
  }

  @Get('dashboard')
  async getDashboardData(@Query('businessId') businessId: string) {
    return this.accountingService.getDashboardData(businessId);
  }
}
