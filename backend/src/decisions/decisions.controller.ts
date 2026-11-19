
import {
    Query,
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    ParseIntPipe,
} from '@nestjs/common';

import { DecisionsService } from './decisions.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';

@Controller('decisions')
export class DecisionsController {
    constructor(private readonly decisionsService: DecisionsService) { }

    // create a decision
    @Post()
    create(@Body() createDecisionDto: CreateDecisionDto) {
        return this.decisionsService.create(createDecisionDto);
    }

    // get all decisions
    @Get()
    findAll() {
        return this.decisionsService.findAll();
    }

    // get one decision
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.decisionsService.findOne(id);
    }

    // update a decision
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateDecisionDto: UpdateDecisionDto,
    ) {
        return this.decisionsService.update(id, updateDecisionDto);
    }

    // get all versions of a decision
    @Get(':id/versions')
    findVersions(@Param('id') id: string) {
        return this.decisionsService.findVersions(id);
    }
    @Get(':id/versions/compare')
    compareVersions(
        @Param('id') id: string,
        @Query('from', ParseIntPipe) from: number,
        @Query('to', ParseIntPipe) to: number,
    ) {
        return this.decisionsService.compareVersions(id, from, to);
    }

    // get a specific version of a decision
    @Get(':id/versions/:versionNumber')
    findVersion(
        @Param('id') id: string,
        @Param('versionNumber', ParseIntPipe) versionNumber: number,
    ) {
        return this.decisionsService.findVersion(id, versionNumber);
    }


}
