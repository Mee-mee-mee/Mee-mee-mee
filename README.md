
import { Controller, Param, Get, Req, Res } from '@nestjs/common';
import { TaskService } from './task.service';
import { ApiTags } from '@nestjs/swagger';
import logger from '../../config/Log.config';
import { Request, Response } from 'express';

const config = require('config');
@Controller('ioppm')
@ApiTags('Default')
export class TaskController {
  constructor(private taskService: TaskService) {}
  //This will return the tasks associated with a PM
  @Get('/pm/:pmHeaderId/tasks')
  async getTasksByPm(
    @Param('pmHeaderId') pmHeaderId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const pmData: any = await  this.taskService.PmData(pmHeaderId);
      config.pmData;

      if (pmData.length == 0) {
        return res.status(204).send();
      } else {
        return res.send(pmData);
      }
    } catch (err) {
      logger.error(' No tasks found for PM ', err);
      return res.status(500).json(err);
    }
  }
}

-----------------------------------
import { Injectable } from '@nestjs/common';
import taskrepo from "./task.repo";

@Injectable()
export class TaskService {
    constructor(private taskrepo: taskrepo) {}

    async PmData(pmHeaderId) {
        try {
            const { headerData, pmtasks } = await this.taskrepo.pmSData(pmHeaderId);

            const transformedData = pmtasks.map(item => {
                const lowerCaseItem = {};
                for (const key in item) {
                    if (item.hasOwnProperty(key)) {
                        lowerCaseItem[key.toLowerCase()] = item[key];
                    }
                }
                return lowerCaseItem;
            });

            return { 
                headerData, 
                pmtasks: transformedData 
            };

        } catch (error) {
            throw error;
        }
    }
}
----------------------------------------
import { Injectable } from '@nestjs/common';
import Oracle from '../common/database/oracle';
import { queries } from "./task.qFactory";

@Injectable()
export default class taskrepo {
    constructor(private oraUtil: Oracle) {}

    async pmSData(pmHeaderId) {
        try {
            // Fetch the pmtasks and header data
            const query = queries.getTestById;
            const qParams = [pmHeaderId];
            let pmData: any = await this.oraUtil.executeQuery(query, qParams);
            pmData = pmData.rows;

            const query1 = queries.getestById;
            let headerData1: any = await this.oraUtil.executeQuery(query1, qParams);

            // For each task, fetch the availablestatuses
            const statusQuery = queries.getTestbyId;
            const statusParams = [pmHeaderId];
            let statusData: any = await this.oraUtil.executeQuery(statusQuery, statusParams);
            const statusArray = statusData.rows.map(row => row.STATUS_ID);
            for (let task of pmData) {
                // Extract STATUS_ID values

                // Attach availablestatuses to each task
                task.availablestatuses = statusArray;
            }

            return {
                headerData: headerData1.rows,
                pmtasks: pmData
            };
        } catch (error) {
            throw error;
        }
    }
}
-------------------------------------------
export const queries = {
    getTestById:` 
    SELECT
    c.CATEGORY_NAME AS category,
    a.HELP_TEXT AS cfd_helptext_coverted,
    a.COMMENTS AS comments,
    d.STATUS_NAME AS defaultstatus,
    a.IS_OPTIONAL AS isoptional,
    a.META_CREATED_BY AS meta_createdby,
    a.META_CREATED_DATE AS meta_createddate,
    a.META_LAST_UPDATED_BY AS meta_lastupdateby,
    a.META_LAST_UPDATED_DATE AS meta_lastupdatedate,
    a.META_UNIVERSAL_ID AS meta_universalid,
    a.MINUTES_EST AS minutes_est,
    e.SPECIFIC_DATA_DESC AS specifictask,
    e.SPECIFIC_DATA_VALUE AS specifictask_value,
    a.TASK_NAME AS taskname,
    d.STATUS_ID AS status
FROM
    opspm.PM_TASK_LIST_ITEM a
LEFT JOIN
    opspm.PM_TEMPLATE_TASK b ON a.TASK_ID = b.TASK_ID
LEFT JOIN
    opspm.PM_TASK_CATEGORY c ON a.CATEGORY_ID = c.CATEGORY_ID
LEFT JOIN
    opspm.PM_STATUS d ON a.DEFAULT_STATUS_ID = d.STATUS_ID
LEFT JOIN
    opspm.PM_SPECIFIC_DATA e ON a.SPECIFIC_DATA_ID = e.SPECIFIC_DATA_ID
	LEFT JOIN
  opspm.PM_FREQUENCY f on a.FREQUENCY_ID= f.FREQUENCY_ID
  LEFT JOIN
  ops_Pm_data s ON s.FREQUENCY= f.FREQUENCY_NAME
    WHERE s.PM_UNID = :pmHeaderId
    `,
    getestById: `
     SELECT 
    
    pmd_widget_pm_details.NUM_OF_TASKS AS numtasks, 
    pmd_widget_pm_details.NUM_OF_TASKS_DONE AS numstasksdone 
   
FROM 
    pmd_widget_pm_details
 
     WHERE pmd_widget_pm_details.PM_UNID = :pmHeaderId 

    `,
    getTestbyId:`
    SELECT DISTINCT a.STATUS_ID
FROM opspm.PM_TASK_AVAILABLE_STATUS_ITEM a
JOIN OPSPM.PM_LOCATION_TASK b
ON a.TASK_ID = b.TASK_ID
WHERE b.PM_HEADER_ID = :pmHeaderId  
    `
};
