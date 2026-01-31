import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import {
  CreateDisputeDto,
  UpdateDisputeStatusDto,
  AddEvidenceDto,
  ResolveDisputeDto,
  AppealDisputeDto,
  DisputeQueryDto,
} from './dto/dispute.dto';
import { Dispute } from './entities/dispute.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dispute' })
  @ApiResponse({
    status: 201,
    description: 'Dispute created successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  @ApiResponse({ status: 404, description: 'Split not found' })
  async create(@Body() createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    return this.disputeService.createDispute(createDisputeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all disputes with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Disputes retrieved successfully',
  })
  @ApiQuery({ name: 'splitId', required: false, description: 'Filter by split ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'raisedBy', required: false, description: 'Filter by wallet address' })
  @ApiQuery({ name: 'disputeType', required: false, description: 'Filter by dispute type' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query() query: DisputeQueryDto,
  ): Promise<{ disputes: Dispute[]; total: number }> {
    return this.disputeService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get dispute statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiQuery({ name: 'splitId', required: false, description: 'Filter by split ID' })
  async getStatistics(@Query('splitId') splitId?: string) {
    return this.disputeService.getStatistics(splitId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a dispute by ID' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispute retrieved successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async findOne(@Param('id') id: string): Promise<Dispute> {
    return this.disputeService.findOne(id);
  }

  @Patch(':id/evidence')
  @ApiOperation({ summary: 'Add evidence to a dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Evidence added successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to add evidence' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async addEvidence(
    @Param('id') id: string,
    @Body() addEvidenceDto: AddEvidenceDto,
    @CurrentUser('walletAddress') walletAddress: string,
  ): Promise<Dispute> {
    return this.disputeService.addEvidence(id, addEvidenceDto, walletAddress);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update dispute status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateDisputeStatusDto,
  ): Promise<Dispute> {
    return this.disputeService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/resolve')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Resolve a dispute (Admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispute resolved successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveDisputeDto,
  ): Promise<Dispute> {
    return this.disputeService.resolveDispute(id, resolveDto);
  }

  @Post(':id/reject')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a dispute (Admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispute rejected successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async reject(
    @Param('id') id: string,
    @Body() body: { reasoning: string; rejectedBy: string },
  ): Promise<Dispute> {
    return this.disputeService.rejectDispute(id, body.reasoning, body.rejectedBy);
  }

  @Post(':id/appeal')
  @ApiOperation({ summary: 'Appeal a resolved or rejected dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID to appeal' })
  @ApiResponse({
    status: 201,
    description: 'Appeal created successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Bad request or appeal limit reached' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async appeal(
    @Param('id') id: string,
    @Body() appealDto: AppealDisputeDto,
  ): Promise<Dispute> {
    return this.disputeService.appealDispute(id, appealDto);
  }

  @Post('auto-resolve')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger automatic dispute resolution (Admin only)',
    description: 'Processes open disputes for automatic resolution based on time and rules',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-resolution process completed',
  })
  async autoResolve(): Promise<{ message: string }> {
    await this.disputeService.autoResolveDisputes();
    return { message: 'Auto-resolution process completed' };
  }
}