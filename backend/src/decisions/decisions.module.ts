
import { Module } from '@nestjs/common';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { AuthModule } from '../auth/auth.module';
@Module({
  controllers: [DecisionsController],
  providers: [DecisionsService],
  imports: [AuthModule],
})
export class DecisionsModule { }
