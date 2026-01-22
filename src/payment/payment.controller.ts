import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { Payment } from './entities/payment.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment successfully created',
    type: Payment,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Payment with this transaction hash already exists',
  })
  async create(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return await this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments with optional filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of payments',
    type: [Payment],
  })
  async findAll(@Query() queryDto: QueryPaymentsDto): Promise<Payment[]> {
    return await this.paymentsService.findAll(queryDto);
  }

  @Get('split/:splitId')
  @ApiOperation({ summary: 'Get all payments for a specific split' })
  @ApiParam({ name: 'splitId', description: 'Split ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of payments for the split',
    type: [Payment],
  })
  async findBySplit(
    @Param('splitId', ParseUUIDPipe) splitId: string,
  ): Promise<Payment[]> {
    return await this.paymentsService.findBySplit(splitId);
  }

  @Get('participant/:participantId')
  @ApiOperation({ summary: 'Get all payments for a specific participant' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of payments for the participant',
    type: [Payment],
  })
  async findByParticipant(
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<Payment[]> {
    return await this.paymentsService.findByParticipant(participantId);
  }

  @Get('split/:splitId/stats')
  @ApiOperation({ summary: 'Get payment statistics for a split' })
  @ApiParam({ name: 'splitId', description: 'Split ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment statistics for the split',
  })
  async getSplitStats(@Param('splitId', ParseUUIDPipe) splitId: string) {
    return await this.paymentsService.getSplitStats(splitId);
  }

  @Get('participant/:participantId/stats')
  @ApiOperation({ summary: 'Get payment statistics for a participant' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment statistics for the participant',
  })
  async getParticipantStats(
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return await this.paymentsService.getParticipantStats(participantId);
  }

  @Get('tx/:txHash')
  @ApiOperation({ summary: 'Get payment by Stellar transaction hash' })
  @ApiParam({ name: 'txHash', description: 'Stellar transaction hash' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment found',
    type: Payment,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async findByTxHash(@Param('txHash') txHash: string): Promise<Payment> {
    return await this.paymentsService.findByTxHash(txHash);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment found',
    type: Payment,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return await this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment updated successfully',
    type: Payment,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    return await this.paymentsService.update(id, updatePaymentDto);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment confirmed successfully',
    type: Payment,
  })
  async confirmPayment(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return await this.paymentsService.confirmPayment(id);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Mark a payment as failed' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment marked as failed',
    type: Payment,
  })
  async failPayment(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return await this.paymentsService.failPayment(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Payment deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete confirmed payments',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.paymentsService.remove(id);
  }
}