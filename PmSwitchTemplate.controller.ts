import {
  Controller,
  Param,
  Get,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { PmSwitchTemplateService } from './PmSwitchTemplate.service';
import { ApiTags } from '@nestjs/swagger';
import logger from '../common/logger/logger';
import { Request, Response } from 'express';

@Controller('ioppm')
@ApiTags('Default')
export class PmSwitchTemplateController {
  constructor(
    private readonly pmSwitchTemplateService: PmSwitchTemplateService,
  ) {}

  @Get('/switch/:switchUnId/pmTemplates')
  async getPmTemplateBySwitch(
    @Param('switchUnId') switchUnId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    logger.info('Processing request to fetch PM templates for a specific switch.');
    logger.debug('Request parameters:', { switchUnId });
    logger.debug('Request headers:', { headers: req.headers });

    try {
      logger.info('Fetching PM templates for the switch.', { switchUnId });
      const result: any = await this.pmSwitchTemplateService.getPmTemplates(switchUnId);
      logger.debug('Raw result from service:', { result });

      if (result) {
        const rows = result?.rows || [];
        if (rows && rows.length > 0) {
          logger.info('PM templates found for the switch.', { switchUnId, templatesCount: rows.length });
          const templates = rows.map((template) => ({
            name: template.TEMPLATE_NAME,
            listTemplateId: template.LIST_TEMPLATE_ID,
            description: template.TEMPLATE_DESC,
            isDisabled: template.IS_DISABLED,
            frequency: template.FREQUENCY_NAME,
          }));
          return res.json({
            switchUnId: switchUnId,
            templates,
          });
        }
      }

      logger.info('No PM templates found for the switch.', { switchUnId });
      return res.status(200).json({
        switchUnid: switchUnId,
        templates: [],
      });
    } catch (err) {
      logger.error('Error while fetching PM templates for the switch.', { errorMessage: err.message, stack: err.stack });
      logger.debug('Error details:', { error: err });
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }
}