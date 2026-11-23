
import {
    Query, Controller, Get, Post, Body, Param, Patch, ParseIntPipe, UseGuards, Req, ValidationPipe,
} from '@nestjs/common';
import { RestoreVersionDto } from './dto/restore-version.dto';
import { FindDecisionsDto } from './dto/find-decisions.dto';
import { DecisionsService } from './decisions.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('decisions')
@UseGuards(JwtAuthGuard)
export class DecisionsController {
    constructor(
        private readonly decisionsService: DecisionsService,
    ) { }

    // Create a decision
    @Post()
    create(
        @Body() createDecisionDto: CreateDecisionDto,
        @Req() req: any,
    ) {
        return this.decisionsService.create(
            createDecisionDto,
            req.user.id,
        );
    }
    // Get all decisions
    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        findDecisionsDto: FindDecisionsDto,
        @Req() req: any,
    ) {
        return this.decisionsService.findAll(
            findDecisionsDto,
            req.user.id,
        );
    }
    // Get one decision
    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.decisionsService.findOne(
            id,
            req.user.id,
        );
    }
    // Update a decision
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateDecisionDto: UpdateDecisionDto,
        @Req() req: any,
    ) {
        return this.decisionsService.update(
            id,
            updateDecisionDto,
            req.user.id,
        );
    }
    // Get all versions
    @Get(':id/versions')
    findVersions(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.decisionsService.findVersions(
            id,
            req.user.id,
        );
    }

    // Compare two versions
    @Get(':id/versions/compare')
    compareVersions(
        @Param('id') id: string,
        @Query('from', ParseIntPipe) from: number,
        @Query('to', ParseIntPipe) to: number,
        @Req() req: any,
    ) {
        return this.decisionsService.compareVersions(
            id,
            from,
            to,
            req.user.id,
        );
    }

    // Get a specific version
    @Get(':id/versions/:versionNumber')
    findVersion(
        @Param('id') id: string,
        @Param('versionNumber', ParseIntPipe) versionNumber: number,
        @Req() req: any,
    ) {
        return this.decisionsService.findVersion(
            id,
            versionNumber,
            req.user.id,
        );
    }

    // Restore a historical version
    @Post(':id/versions/:versionNumber/restore')
    restoreVersion(
        @Param('id') id: string,
        @Param('versionNumber', ParseIntPipe) versionNumber: number,
        @Body() restoreVersionDto: RestoreVersionDto,
        @Req() req: any,
    ) {
        return this.decisionsService.restoreVersion(
            id,
            versionNumber,
            restoreVersionDto.commitMessage,
            req.user.id,
        );
    }
}
