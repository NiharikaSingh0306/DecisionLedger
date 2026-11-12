import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module'
import { DecisionsService } from './decisions/decisions.service';
import { DecisionsModule } from './decisions/decisions.module';

@Module({
  imports: [PrismaModule, DecisionsModule],
  controllers: [AppController],
  providers: [AppService, DecisionsService],
})
export class AppModule { }
