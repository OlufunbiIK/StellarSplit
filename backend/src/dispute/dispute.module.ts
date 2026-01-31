import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { Dispute } from './entities/dispute.entity';
import { NotificationModule } from '../notification/notification.module';
import { SplitModule } from '../split/split.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispute]),
    NotificationModule,
    SplitModule,
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}