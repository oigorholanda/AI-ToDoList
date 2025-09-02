import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { PromptDto } from './dto/prompt.dto';


@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }


    @Post('prompt')
    async handlePrompt(@Body() dto: PromptDto) {
        return this.aiService.handlePrompt(dto);
    }
}